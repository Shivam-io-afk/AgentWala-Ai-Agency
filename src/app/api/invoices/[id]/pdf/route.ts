import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatINR, getPackageWithSettings } from "@/lib/pricing";
import { SITE_CONFIG } from "@/content/site";
import { getSessionFromRequest } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const invoices = await db.getInvoices();
    const invoice = invoices.find((i) => i.id === id);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const client = await db.getClientById(invoice.client_id);
    const project = invoice.project_id ? await db.getProjectById(invoice.project_id) : null;
    const settings = await db.getSettings();

    // Bug 3: Protect invoice PDFs - require founder login or valid portal token for that project/client
    const session = getSessionFromRequest(req);
    const portalToken = req.nextUrl.searchParams.get("token") || req.headers.get("x-portal-token");

    let isAuthorized = false;
    if (session && session.email) {
      isAuthorized = true;
    } else if (portalToken) {
      if (
        (client && client.portal_token === portalToken) ||
        (project && project.portal_token === portalToken)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new NextResponse("Unauthorized: Founder login or valid portal token required.", { status: 401 });
    }

    // Bug 4: Money in whole rupees, display stored amounts
    const subtotal = Math.round(invoice.subtotal_paise / 100);
    const cgst = Math.round((invoice.cgst_paise || 0) / 100);
    const sgst = Math.round((invoice.sgst_paise || 0) / 100);
    const igst = Math.round((invoice.igst_paise || 0) / 100);
    const total = Math.round(invoice.total_paise / 100);

    // Bug 5: GST-off invoices: Title 'Invoice' (Bill of Supply), no GSTIN, no tax lines, 'Not registered under GST - All prices net'
    const isGst = Boolean(invoice.is_gst && settings.gst_registered && settings.gstin);
    const documentTitle = isGst ? "TAX INVOICE" : "Invoice (Bill of Supply)";

    // Line item matching package
    const pkgId = project?.package_id || client?.package || "growth";
    const pkg = getPackageWithSettings(pkgId, (settings as any).package_prices);

    let lineDescription = `${pkg.name} Setup & Milestone`;
    let lineSubtext = pkg.description || "Services provided as per Master Agreement Annex A";

    if (invoice.type === "advance") {
      lineDescription = `${pkg.name} — Architecture Setup & Initial Sprint (Advance)`;
    } else if (invoice.type === "milestone") {
      lineDescription = `${pkg.name} — Core Implementation & Integration (Mid-Milestone)`;
    } else if (invoice.type === "final") {
      lineDescription = `${pkg.name} — Deliverables & Handover Settlement`;
    } else if (invoice.type === "monthly") {
      lineDescription = `${pkg.name} — Monthly Retainer / Care Plan`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle} ${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1C1F3A; padding: 40px; margin: 0; background: #fff; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #ECE6D8; padding: 36px; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ECE6D8; padding-bottom: 24px; }
    .logo { font-size: 26px; font-weight: 800; color: #1C1F3A; }
    .tagline { font-size: 12px; color: #727791; margin-top: 4px; }
    .title-box { text-align: right; }
    .title { font-size: 22px; font-weight: 800; color: #1C1F3A; }
    .inv-num { font-size: 14px; font-weight: 600; color: #9A6400; margin-top: 4px; }
    .details { display: flex; justify-content: space-between; margin: 24px 0; font-size: 13px; line-height: 1.6; }
    .bill-to b, .company-info b { color: #1C1F3A; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
    th { background: #FBF7EE; color: #1C1F3A; text-align: left; padding: 12px; font-weight: 700; border-bottom: 2px solid #ECE6D8; }
    td { padding: 12px; border-bottom: 1px solid #ECE6D8; }
    .totals { margin-top: 24px; display: flex; justify-content: flex-end; font-size: 13px; }
    .totals table { width: 340px; }
    .totals td { padding: 6px 12px; }
    .grand-total { font-size: 16px; font-weight: 800; background: #FAF0D7; color: #1C1F3A; }
    .banking { margin-top: 36px; padding: 18px; background: #FBF7EE; border-radius: 8px; font-size: 12px; line-height: 1.6; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #727791; border-top: 1px solid #ECE6D8; padding-top: 16px; }
    @media print { body { padding: 0; } .invoice-box { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="logo">${settings.agency_name || "Agmeta"}</div>
        <div class="tagline">${settings.tagline || SITE_CONFIG.LEGAL_NAME}</div>
        <div style="font-size: 12px; color: #585D7A; margin-top: 6px;">
          ${isGst ? `GSTIN: ${settings.gstin} · ` : ""}PAN: ${settings.pan || SITE_CONFIG.PAN}<br>
          ${settings.address || SITE_CONFIG.ADDRESS}
        </div>
      </div>
      <div class="title-box">
        <div class="title">${documentTitle}</div>
        <div class="inv-num">${invoice.invoice_number}</div>
        <div style="font-size: 12px; color: #727791; margin-top: 4px;">
          Date: ${new Date(invoice.created_at).toLocaleDateString("en-IN")}<br>
          Due Date: ${invoice.due_date}
        </div>
      </div>
    </div>

    <div class="details">
      <div class="bill-to">
        <b>Billed To:</b><br>
        ${client ? client.name : "Client Organization"}<br>
        Attn: ${client ? client.owner_name : "Authorized Signatory"}<br>
        Phone: ${client ? client.phone : "N/A"}<br>
        State: ${client?.state || "N/A"}${client?.city ? `, City: ${client.city}` : ""}<br>
        ${(client as any)?.gstin ? `Client GSTIN: ${(client as any).gstin}` : ""}
      </div>
      <div class="company-info" style="text-align: right;">
        <b>Service SAC Code:</b> ${settings.sac_code || "998313"}<br>
        (Information Technology Software Services)<br>
        <b>Invoice Type:</b> ${invoice.type.toUpperCase()}<br>
        <b>Payment Status:</b> <span style="font-weight: 700; color: ${invoice.status === "paid" ? "#2E7D5B" : "#B4540A"};">${invoice.status.toUpperCase()}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>SAC</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <b>${lineDescription}</b><br>
            <span style="font-size: 11px; color: #727791;">${lineSubtext}</span>
          </td>
          <td>${settings.sac_code || "998313"}</td>
          <td style="text-align: right;">${formatINR(subtotal)}</td>
          <td style="text-align: right; font-weight: 600;">${formatINR(subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right; font-weight: 600;">${formatINR(subtotal)}</td>
        </tr>
        ${
          isGst
            ? igst > 0
              ? `<tr><td>IGST (18.0%):</td><td style="text-align: right;">${formatINR(igst)}</td></tr>`
              : `<tr><td>CGST (9.0%):</td><td style="text-align: right;">${formatINR(cgst)}</td></tr>
                 <tr><td>SGST (9.0%):</td><td style="text-align: right;">${formatINR(sgst)}</td></tr>`
            : ""
        }
        <tr class="grand-total">
          <td><b>Total (INR):</b></td>
          <td style="text-align: right; font-weight: 800;">${formatINR(total)}</td>
        </tr>
      </table>
    </div>

    <div class="banking">
      <b>Bank &amp; Electronic Payment Details:</b><br>
      Account Name: ${settings.account_name || SITE_CONFIG.LEGAL_NAME}<br>
      Bank: ${settings.bank_name || SITE_CONFIG.BANK_NAME} · Account #: ${settings.account_number || SITE_CONFIG.ACCOUNT_NUMBER} · IFSC: ${settings.ifsc || SITE_CONFIG.IFSC_CODE}<br>
      UPI ID: ${settings.upi_id || SITE_CONFIG.UPI_ID}
    </div>

    <div class="footer">
      ${
        isGst
          ? "This is a digitally generated GST Tax Invoice compliant with the Goods & Services Tax Act, 2017. No physical signature required."
          : "Not registered under GST - All prices net. (Bill of Supply under GST Composition / Exemption Rules. No tax collected.)"
      }
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error generating invoice PDF", { status: 500 });
  }
}
