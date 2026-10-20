import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/pricing";
import { SITE_CONFIG } from "@/content/site";

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
    const subtotal = invoice.subtotal_paise / 100;
    const gst = invoice.gst_paise / 100;
    const total = invoice.total_paise / 100;
    const cgst = gst / 2;
    const sgst = gst / 2;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST Tax Invoice ${invoice.invoice_number}</title>
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
    .totals table { width: 320px; }
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
        <div class="logo">AgentWala</div>
        <div class="tagline">${SITE_CONFIG.LEGAL_NAME}</div>
        <div style="font-size: 12px; color: #585D7A; margin-top: 6px;">
          GSTIN: ${SITE_CONFIG.GSTIN} · PAN: ${SITE_CONFIG.PAN}<br>
          ${SITE_CONFIG.ADDRESS}
        </div>
      </div>
      <div class="title-box">
        <div class="title">TAX INVOICE</div>
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
        City: ${client?.city || SITE_CONFIG.CITY}, India<br>
        Place of Supply: Maharashtra (27)
      </div>
      <div class="company-info" style="text-align: right;">
        <b>Service SAC Code:</b> 998313<br>
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
            <b>${invoice.type === "advance" ? "AI Receptionist Setup & Custom Calibration (Advance 50%)" : "AI Receptionist Final Deliverables & Month 1 Retainer"}</b><br>
            <span style="font-size: 11px; color: #727791;">Includes multilingual telephone bot, WhatsApp 24×7 integration, and calendar booking.</span>
          </td>
          <td>998313</td>
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
        <tr>
          <td>CGST (9.0%):</td>
          <td style="text-align: right;">${formatINR(cgst)}</td>
        </tr>
        <tr>
          <td>SGST (9.0%):</td>
          <td style="text-align: right;">${formatINR(sgst)}</td>
        </tr>
        <tr class="grand-total">
          <td><b>Total (INR):</b></td>
          <td style="text-align: right; font-weight: 800;">${formatINR(total)}</td>
        </tr>
      </table>
    </div>

    <div class="banking">
      <b>Bank &amp; Electronic Payment Details:</b><br>
      Account Name: ${SITE_CONFIG.LEGAL_NAME}<br>
      Bank: ${SITE_CONFIG.BANK_NAME} · Account #: ${SITE_CONFIG.ACCOUNT_NUMBER} · IFSC: ${SITE_CONFIG.IFSC_CODE}<br>
      UPI ID: ${SITE_CONFIG.UPI_ID}
    </div>

    <div class="footer">
      This is a digitally generated tax invoice compliant with the Goods &amp; Services Tax Act, 2017. No physical signature required.
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
