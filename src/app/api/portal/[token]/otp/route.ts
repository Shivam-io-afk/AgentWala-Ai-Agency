import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeDocumentHash } from "@/lib/agreement-generator";
import { calculateMilestoneParts } from "@/lib/pricing";

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await req.json();
    const action = body.action;

    // Find client by portal token
    const bundle = await db.getClientPortalBundle(token);
    if (!bundle) {
      return NextResponse.json({ success: false, error: "Invalid portal link" }, { status: 404 });
    }

    const { client, activeProject } = bundle;
    const projectId = activeProject?.id || client.id;

    // Bug 1: Send OTP to registered phone only
    if (action === "send_otp") {
      const registeredPhone = client.phone;
      const { otp } = await db.saveOtp(projectId, registeredPhone, client.id);

      // In development / QA, write OTP only to the mock outbox
      await db.recordOutbox({
        channel: "whatsapp",
        recipient: registeredPhone,
        template_name: "otp_agreement_signature",
        content: `Your Agmeta Master Agreement e-acceptance verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        full_text: `Your Agmeta Master Agreement e-acceptance verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        project_id: projectId,
        client_id: client.id,
        project_name: activeProject?.name,
        client_name: client.name,
        status: "sent",
      });

      // Do NOT write OTP code into activity log
      await db.logActivity(
        "automation",
        "Agreement OTP Dispatched",
        `6-digit OTP dispatched to registered phone (${registeredPhone}) for agreement e-acceptance`,
        client.id
      );

      // Do NOT include testOtp in API response
      return NextResponse.json({
        success: true,
        message: `OTP sent to registered phone ${registeredPhone}`,
      });
    }

    // Bug 1: Verify OTP strictly
    if (action === "verify_otp") {
      const inputOtp = String(body.otp || "").trim();
      const signerName = body.name?.trim() || client.owner_name;

      const verification = await db.verifyOtp(projectId, inputOtp);
      if (!verification.valid) {
        return NextResponse.json({
          success: false,
          error: verification.error || "Invalid OTP code",
        }, { status: 400 });
      }

      const signerIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      const documentHash = computeDocumentHash(`${client.id}-${projectId}-${signerName}-${Date.now()}`);

      const acceptance = await db.recordAgreementAcceptance({
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

      // Tick s1 on client and project
      await db.updateCheck(client.id, "s1", true, "client");

      // Auto-generate advance invoice (Milestone 1) in whole rupees (Bug 4)
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
        `Agreement digitally accepted by ${signerName} (${client.phone}) with verified OTP from IP ${signerIp}. Advance invoice issued. Ticked s1.`,
        client.id
      );

      return NextResponse.json({
        success: true,
        message: "Agreement accepted successfully! Advance payment milestone activated.",
        acceptance,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
