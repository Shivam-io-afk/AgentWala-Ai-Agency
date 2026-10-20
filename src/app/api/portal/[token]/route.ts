import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateBill, formatINR, calculateMilestoneParts } from "@/lib/pricing";
import { computeDocumentHash } from "@/lib/agreement-generator";

interface Params {
  params: Promise<{ token: string }>;
}

// Bug 24: High-speed portal bundle fetch (<20ms response time)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const bundle = await db.getClientPortalBundle(token);
    if (!bundle) {
      return NextResponse.json({ success: false, error: "Invalid or expired client portal link" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...bundle,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const bundle = await db.getClientPortalBundle(token);
    if (!bundle) {
      return NextResponse.json({ success: false, error: "Invalid portal link" }, { status: 404 });
    }

    const { client, activeProject, projects } = bundle;
    const projectId = activeProject?.id || client.id;
    const body = await req.json();
    const action = body.action;

    // Bug 1: Send 6-Digit OTP for agreement acceptance
    // - Send ONLY to client's registered phone
    // - Never return testOtp in API
    // - Do not log OTP code in activity logs
    if (action === "send_otp") {
      const registeredPhone = client.phone;
      const { otp } = await db.saveOtp(projectId, registeredPhone, client.id);

      // Record in Mock Outbox for dev/testing
      await db.recordOutbox({
        channel: "whatsapp",
        recipient: registeredPhone,
        template_name: "otp_agreement_signature",
        content: `Your AgentWala Master Agreement e-acceptance verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        full_text: `Your AgentWala Master Agreement e-acceptance verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        project_id: projectId,
        client_id: client.id,
        project_name: activeProject?.name,
        client_name: client.name,
        status: "sent",
      });

      await db.logActivity(
        "automation",
        "Agreement OTP Dispatched",
        `6-digit OTP dispatched to registered phone (${registeredPhone}) for agreement e-acceptance`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: `OTP sent to registered phone ${registeredPhone}`,
      });
    }

    // Bug 1: Verify OTP & Accept Agreement (Section 8, ticks s1)
    // - Strict verification against db.verifyOtp (rejects wrong, expired, reused, >5 attempts)
    // - Stores signer name, timestamp, and IP address
    if (action === "verify_otp") {
      const inputOtp = String(body.otp || "").trim();
      const signerName = body.name?.trim() || client.owner_name;

      const verification = await db.verifyOtp(projectId, inputOtp);
      if (!verification.valid) {
        return NextResponse.json({ success: false, error: verification.error || "Invalid OTP" }, { status: 400 });
      }

      const signerIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      const documentHash = computeDocumentHash(`${client.id}-${projectId}-${signerName}-${Date.now()}`);

      await db.recordAgreementAcceptance({
        agreement_id: `agr-${projectId}`,
        project_id: projectId,
        client_id: client.id,
        signer_name: signerName,
        signer_phone: client.phone,
        signer_ip: signerIp,
        user_agent: req.headers.get("user-agent") || "Web Portal",
        accepted_at: new Date().toISOString(),
        document_hash: documentHash,
      });

      // Ticks s1
      await db.updateCheck(client.id, "s1", true, "client");

      // Auto-generate Advance Invoice (Milestone 1) in whole rupees (Bug 4)
      const projectPriceRupees = activeProject?.price_paise ? Math.round(activeProject.price_paise / 100) : 35000;
      const milestonePlan = activeProject?.milestone_plan || (projectPriceRupees > 100000 ? "40_30_30" : "50_50");
      const parts = calculateMilestoneParts(projectPriceRupees, milestonePlan);
      const advanceRupees = parts[0];

      const existingInvoices = await db.getInvoicesByClientId(client.id);
      const hasAdvance = existingInvoices.some((i) => i.type === "advance");

      if (!hasAdvance) {
        await db.createInvoice({
          client_id: client.id,
          project_id: projectId,
          type: "advance",
          subtotal_paise: advanceRupees * 100,
          razorpay_payment_url: `https://rzp.io/l/aw_adv_${client.id.slice(0, 6)}`,
          status: "sent",
        });
      }

      await db.logActivity(
        "client",
        "Agreement Accepted Online via OTP",
        `Agreement accepted by ${signerName} (${client.phone}) with verified OTP from IP ${signerIp}. Advance invoice issued. Ticked s1.`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: "Agreement accepted successfully! Advance payment milestone activated.",
      });
    }

    // Action: Submit Kickoff Assets (ticks s3)
    if (action === "submit_kickoff_assets") {
      const { assetsText, brandingNotes } = body;
      await db.updateCheck(client.id, "s3", true, "client");
      await db.updateClient(client.id, {
        notes: `${client.notes || ""}\n\n[Kickoff Assets Submitted]: ${assetsText || ""} | Branding: ${brandingNotes || ""}`,
      });

      await db.logActivity(
        "client",
        "Kickoff Assets Submitted",
        `Client submitted kickoff content, logos and requirements. Ticked s3.`,
        client.id
      );
      return NextResponse.json({ success: true, message: "Kickoff assets received! Founder notified." });
    }

    // Action: Submit Revision Round (Bug 8 Server Revision Limits, Bug 18 New-Feature Detection)
    if (action === "submit_revision") {
      const { items, roundNumber } = body;
      const roundNum = Number(roundNumber) || 1;

      // Bug 18: Classify items: revisions (within scope) vs new_feature (out of scope CR)
      const classifiedItems = (items || []).map((text: string) => {
        const lower = text.toLowerCase();
        const isNewFeature =
          lower.includes("new page") ||
          lower.includes("new screen") ||
          lower.includes("add payment gateway") ||
          lower.includes("extra language") ||
          lower.includes("crm integration") ||
          lower.includes("custom dashboard") ||
          lower.includes("new module");

        return {
          text,
          ai_label: isNewFeature ? ("new_feature" as const) : ("revision" as const),
          ai_reason: isNewFeature
            ? "Requires new workflow / architectural component outside Annex A scope. Classified as Change Request at ₹1,000/hr."
            : "Refines styling, copy, tone, or existing flow within agreed Annex A scope.",
        };
      });

      // db.submitRevisionRound enforces limits server-side (w3 must be done, revisions_used < included)
      const round = await db.submitRevisionRound(projectId, roundNum, classifiedItems);

      if (roundNum === 1) {
        await db.updateCheck(client.id, "v1", true, "client");
      } else {
        await db.updateCheck(client.id, "v2", true, "client");
      }

      await db.logActivity(
        "client",
        `Revision Round ${roundNum} Submitted`,
        `Client submitted ${classifiedItems.length} consolidated feedback item(s). Ticked ${roundNum === 1 ? "v1" : "v2"}.`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: `Revision round ${roundNum} submitted! Founder notified to implement changes.`,
        round,
      });
    }

    // Action: Approve Delivery (ticks v3 and triggers f1 final invoice)
    if (action === "approve_delivery") {
      await db.updateCheck(client.id, "v3", true, "client");

      // Auto-generate Final Invoice in whole rupees (Bug 4)
      const existingInvoices = await db.getInvoicesByClientId(client.id);
      const hasFinal = existingInvoices.some((i) => i.type === "final");

      if (!hasFinal) {
        const projectPriceRupees = activeProject?.price_paise ? Math.round(activeProject.price_paise / 100) : 35000;
        const milestonePlan = activeProject?.milestone_plan || (projectPriceRupees > 100000 ? "40_30_30" : "50_50");
        const parts = calculateMilestoneParts(projectPriceRupees, milestonePlan);
        const finalRupees = parts[parts.length - 1]; // last milestone = fee - sum of earlier parts

        await db.createInvoice({
          client_id: client.id,
          project_id: projectId,
          type: "final",
          subtotal_paise: finalRupees * 100,
          razorpay_payment_url: `https://rzp.io/l/aw_fin_${client.id.slice(0, 6)}`,
          status: "sent",
        });
      }

      await db.updateCheck(client.id, "f1", true, "automation");

      await db.logActivity(
        "client",
        "Delivery Approved by Client",
        `Client approved build deliverables. Final invoice generated. Ticked v3 & f1.`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: "Delivery approved! Final settlement invoice issued for handover.",
      });
    }

    // Action: Confirm Handover & Start Warranty (ticks h2 & h3)
    if (action === "confirm_handover") {
      await db.updateCheck(client.id, "h2", true, "client");
      await db.updateCheck(client.id, "h3", true, "automation");

      await db.logActivity(
        "client",
        "Handover Receipt Confirmed",
        `Client confirmed receipt of Annex B handover kit. 30-day warranty & care plan initiated. Ticked h2 & h3.`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: "Handover confirmed! 30-Day Bugfix Warranty and Care Plan are now active.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown portal action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
