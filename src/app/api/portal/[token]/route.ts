import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateBill, formatINR, rupeesToPaise } from "@/lib/pricing";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const client = await db.getClientByToken(token);
    if (!client) {
      return NextResponse.json({ success: false, error: "Invalid or expired client portal link" }, { status: 404 });
    }

    const proposal = await db.getProposalByClientId(client.id);
    const invoices = await db.getInvoicesByClientId(client.id);

    return NextResponse.json({
      success: true,
      client,
      proposal,
      invoices,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const client = await db.getClientByToken(token);
    if (!client) {
      return NextResponse.json({ success: false, error: "Invalid portal link" }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action;

    // Action 1: Accept Proposal (triggers A9 & ticks w1)
    if (action === "accept_proposal") {
      const { acceptedName } = body;
      const now = new Date().toISOString();

      await db.updateCheck(client.id, "w1", true, "client");

      // Update proposal if exists
      const proposal = await db.getProposalByClientId(client.id);
      if (proposal) {
        await db.updateProposal(proposal.id, {
          status: "accepted",
          accepted_at: now,
          accepted_name: acceptedName || client.owner_name,
        });
      }

      // Generate Advance invoice if not already created (A9)
      const b = calculateBill(client.package, client.founding_offer);
      const existingInvoices = await db.getInvoicesByClientId(client.id);
      const hasAdvance = existingInvoices.some((i) => i.type === "advance");

      if (!hasAdvance) {
        await db.createInvoice({
          client_id: client.id,
          type: "advance",
          subtotal_paise: rupeesToPaise(b.setup * 0.5),
          gst_paise: rupeesToPaise(b.setup * 0.5 * 0.18),
          total_paise: rupeesToPaise(b.advance),
          status: "sent",
          razorpay_payment_url: `https://rzp.io/i/adv_${client.id.slice(-6)}`,
        });
      }

      await db.logActivity(
        "client",
        "Proposal Accepted Online",
        `${acceptedName || client.owner_name} accepted the proposal. Advance payment invoice created. Ticked w1.`,
        client.id
      );

      return NextResponse.json({ success: true, message: "Proposal accepted successfully!" });
    }

    // Action 2: Submit Onboarding Details (triggers A10 & A11, ticks w3)
    if (action === "submit_onboarding") {
      const { timings, consultationFee, doctors, handoffPhone, faqs } = body;

      await db.updateCheck(client.id, "w3", true, "client");

      await db.updateClient(client.id, {
        notes: `${client.notes || ""}\n\n[Onboarding Data]: Timings: ${timings} | Fees: ${consultationFee} | Doctors: ${doctors} | Staff Phone: ${handoffPhone} | FAQs: ${faqs}`,
      });

      // Automation A11: AI draft agent prompt
      await db.updateCheck(client.id, "d1", true, "automation");

      await db.logActivity(
        "client",
        "Onboarding Form Submitted",
        `Onboarding submitted. AI generated draft agent knowledge base. Ticked w3 and d1.`,
        client.id
      );

      return NextResponse.json({ success: true, message: "Onboarding details saved! Agent draft generated." });
    }

    // Action 3: Client approves test call (ticks d3)
    if (action === "approve_agent") {
      await db.updateCheck(client.id, "d3", true, "client");

      await db.logActivity(
        "client",
        "Agent Test Call Approved",
        `Client tested the demo receptionist and approved for go-live. Ticked d3.`,
        client.id
      );

      return NextResponse.json({ success: true, message: "Agent approved for live deployment!" });
    }

    // Action 4: Mock pay advance invoice (simulates Razorpay webhook -> ticks w2)
    if (action === "mock_pay_advance") {
      const invoices = await db.getInvoicesByClientId(client.id);
      const advInv = invoices.find((i) => i.type === "advance");
      if (advInv) {
        await db.updateInvoice(advInv.id, { status: "paid", paid_at: new Date().toISOString() });
      }
      await db.updateCheck(client.id, "w2", true, "automation");

      await db.logActivity(
        "automation",
        "Advance Payment Confirmed (Razorpay Mock)",
        `Advance payment verified. Onboarding link activated. Ticked w2.`,
        client.id
      );

      return NextResponse.json({ success: true, message: "Advance payment recorded!" });
    }

    // Action 5: Mock pay final bill (simulates Razorpay webhook -> ticks q1)
    if (action === "mock_pay_final") {
      const invoices = await db.getInvoicesByClientId(client.id);
      const finInv = invoices.find((i) => i.type === "final");
      if (finInv) {
        await db.updateInvoice(finInv.id, { status: "paid", paid_at: new Date().toISOString() });
      }
      await db.updateCheck(client.id, "q1", true, "automation");

      await db.logActivity(
        "automation",
        "Final Bill Paid (Razorpay Mock)",
        `Final bill payment verified. Ticked q1. Monthly retainer subscription initiated.`,
        client.id
      );

      return NextResponse.json({ success: true, message: "Final payment recorded!" });
    }

    return NextResponse.json({ success: false, error: "Unknown portal action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

