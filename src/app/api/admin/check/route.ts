import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StageKey } from "@/lib/types";
import { calculateBill, formatINR, rupeesToPaise } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { clientId, key, done, doneBy = "user", source } = await req.json();
    const effectiveDoneBy = (source || doneBy) as "user" | "automation" | "client";

    if (!clientId || !key) {
      return NextResponse.json(
        { success: false, error: "clientId and key are required" },
        { status: 400 }
      );
    }

    const FOUNDER_ONLY_KEYS: StageKey[] = ["r1", "r2", "r3", "w2", "w3", "h1"];
    if (effectiveDoneBy === "automation" && FOUNDER_ONLY_KEYS.includes(key as StageKey)) {
      await db.logActivity(
        "system",
        `Blocked automation tick on founder-only key ${key}`,
        `Automation attempted to tick founder-only checklist item ${key}. Blocked server-side.`,
        clientId
      );
      return NextResponse.json(
        { success: false, error: `Key ${key} is founder-only and cannot be ticked by automation` },
        { status: 400 }
      );
    }

    const result = await db.updateCheck(clientId, key as StageKey, Boolean(done), effectiveDoneBy);
    const updatedClient = result?.client || (await db.getClientById(clientId));
    if (!updatedClient) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // Trigger associated automations if ticking 'done'
    if (done) {
      const b = calculateBill(updatedClient.package, updatedClient.founding_offer);

      // w1: Client accepted proposal -> Create Advance Invoice & Razorpay link (A9)
      if (key === "w1") {
        const existingInvoices = await db.getInvoicesByClientId(clientId);
        const hasAdvance = existingInvoices.some((i) => i.type === "advance");
        if (!hasAdvance) {
          const inv = await db.createInvoice({
            client_id: clientId,
            type: "advance",
            subtotal_paise: rupeesToPaise(b.setup * 0.5),
            gst_paise: rupeesToPaise(b.setup * 0.5 * 0.18),
            total_paise: rupeesToPaise(b.advance),
            status: "sent",
            razorpay_payment_url: `https://rzp.io/i/adv_${clientId.slice(-5)}`,
          });
          await db.logActivity(
            "automation",
            "Advance Invoice Generated (A9)",
            `Invoice ${inv.invoice_number} created for ${formatINR(b.advance)}. Payment link dispatched.`,
            clientId
          );
        }
      }

      // v1 + v2 done -> Trigger Final Bill (A14)
      if (key === "v1" || key === "v2") {
        const checks = updatedClient.checks || {};
        if (checks.v1?.done && checks.v2?.done) {
          const existingInvoices = await db.getInvoicesByClientId(clientId);
          const hasFinal = existingInvoices.some((i) => i.type === "final");
          if (!hasFinal) {
            const finalInv = await db.createInvoice({
              client_id: clientId,
              type: "final",
              subtotal_paise: rupeesToPaise(b.setup * 0.5 + b.monthly),
              gst_paise: rupeesToPaise((b.setup * 0.5 + b.monthly) * 0.18),
              total_paise: rupeesToPaise(b.finalBill),
              status: "sent",
              razorpay_payment_url: `https://rzp.io/i/fin_${clientId.slice(-5)}`,
            });
            await db.updateCheck(clientId, "f1", true, "automation");
            await db.logActivity(
              "automation",
              "Final Bill Dispatched (A14)",
              `Final invoice ${finalInv.invoice_number} generated for ${formatINR(b.finalBill)}. Ticked f1.`,
              clientId
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, client: updatedClient, project: result?.project });
  } catch (err: any) {
    console.error("Check API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
