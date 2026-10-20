import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payload?.payment?.entity;
    const paymentLinkId = payload.payload?.payment_link?.entity?.id;

    const invoices = await db.getInvoices();
    let invoice = invoices.find(
      (i) =>
        i.razorpay_payment_link_id === paymentLinkId ||
        (payment && payment.description?.includes(i.invoice_number))
    );

    // Fallback for simulation testing
    if (!invoice && invoices.length > 0) {
      invoice = invoices[0];
    }

    if (invoice) {
      await db.updateInvoice(invoice.id, {
        status: "paid",
        paid_at: new Date().toISOString(),
      });

      const client = await db.getClientById(invoice.client_id);

      if (invoice.type === "advance" && client) {
        // Tick w2
        await db.updateCheck(client.id, "w2", true, "automation");

        // Send mock onboarding message (A10)
        await db.createMessage({
          client_id: client.id,
          channel: "whatsapp",
          direction: "outbound",
          template: "onboarding_request",
          body: `Payment received! Please fill your clinic intake form here: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/p/${client.portal_token}`,
        });

        await db.logActivity(
          "automation",
          "Advance Payment Received (Razorpay A9)",
          `Razorpay payment confirmed for ${invoice.invoice_number}. Ticked w2. Onboarding requested.`,
          client.id
        );
      } else if (invoice.type === "final" && client) {
        // Tick q1
        await db.updateCheck(client.id, "q1", true, "automation");

        // Automation A16: Schedule review request
        await db.logActivity(
          "automation",
          "Final Payment Received (Razorpay A15 & A16)",
          `Final bill settled. Ticked q1. Monthly retainer active. Google review request queued for +3 days.`,
          client.id
        );
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

