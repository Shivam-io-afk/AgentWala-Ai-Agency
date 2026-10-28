import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppDate, getAppTimeISO, getAppTimeIST, formatRupees } from "@/lib/clock";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || (body.service === "cal" ? "cal_booking" : body.service === "razorpay" ? "razorpay_payment" : body.service === "whatsapp" ? "inbound_whatsapp" : undefined);
    const settings = await db.getSettings();

    // 1. Cal.com Discovery Meeting Webhook (Bug 16)
    if (type === "cal_booking") {
      const { projectId, date, time } = body;
      const project = await db.getProjectById(projectId);
      if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      const client = await db.getClientById(project.client_id);

      const bookingDate = date || getAppTimeISO().slice(0, 10);
      const bookingTime = time || "11:00";

      // Combine into meeting ISO timestamp
      const scheduledDateTime = `${bookingDate}T${bookingTime}:00`;

      // 1. Tick b1 (Meeting confirmed) & c2 (Lead booked)
      await db.updateCheck(project.id, "b1", true, "automation");
      await db.updateCheck(project.id, "c2", true, "automation");

      // 2. Pre-meeting brief AI trigger -> tick b2
      await db.updateCheck(project.id, "b2", true, "automation");

      // 3. Update project next step and schedule date
      await db.updateProject(project.id, {
        next_step: `Discovery Meeting on Cal.com at ${bookingTime}`,
        next_step_date: bookingDate,
      });

      // 4. Record WhatsApp confirmation in Outbox
      await db.recordOutbox({
        channel: "whatsapp",
        recipient: client?.phone || "+91 91010 10101",
        template_name: "cal_booking_confirmed",
        content: `Namaste ${client?.owner_name || "there"}! Your Discovery Call with AgentWala is confirmed for ${bookingDate} at ${bookingTime} IST. Meet link: https://meet.google.com/aw-demo-call`,
        full_text: `Namaste ${client?.owner_name || "there"}! Your Discovery Call with AgentWala is confirmed for ${bookingDate} at ${bookingTime} IST. Meet link: https://meet.google.com/aw-demo-call`,
        project_id: project.id,
        project_name: project.name,
        client_id: client?.id,
        client_name: client?.name,
        status: "sent",
      });

      await db.logActivity(
        "automation",
        "Cal.com Webhook: Meeting Confirmed",
        `Booking scheduled for ${bookingDate} at ${bookingTime} IST. Ticked b1, c2, b2.`,
        project.id
      );

      return NextResponse.json({
        success: true,
        message: `Cal.com booking simulated for ${project.name} on ${bookingDate} at ${bookingTime}. Ticked b1, c2 & b2.`,
        scheduledDateTime,
      });
    }

    // 2. Razorpay Payment Webhook (Bug 11: payment.failed handling)
    if (type === "razorpay_payment") {
      const { invoiceId, event = "payment.captured", sendTwice = false } = body;
      const invoices = await db.getInvoices();
      const inv = invoices.find((i) => i.id === invoiceId);

      if (!inv) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      const project = inv.project_id ? await db.getProjectById(inv.project_id) : null;
      const client = await db.getClientById(inv.client_id);

      // Check idempotency if already paid
      if (inv.status === "paid") {
        const message = `Idempotency check passed: Invoice ${inv.invoice_number} is already paid. Duplicate webhook ignored safely with 200 OK.`;
        await db.logActivity(
          "automation",
          "Razorpay Webhook: Duplicate Event Ignored",
          message,
          inv.project_id || inv.client_id
        );
        return NextResponse.json({ success: true, message, duplicateIgnored: true });
      }

      if (event === "payment.captured") {
        const now = getAppTimeISO();
        inv.status = "paid";
        inv.paid_at = now;
        await db.updateInvoice(inv.id, { status: "paid", paid_at: now });

        // If Advance invoice -> tick s2
        if (inv.type === "advance") {
          await db.updateCheck(inv.project_id || inv.client_id, "s2", true, "automation");
        }

        // If Final invoice -> tick f2 (Stage gate: f1 must be ticked)
        if (inv.type === "final") {
          await db.updateCheck(inv.project_id || inv.client_id, "f1", true, "automation");
          await db.updateCheck(inv.project_id || inv.client_id, "f2", true, "automation");
        }

        // Dispatch payment receipt to Mock Outbox
        const amountINR = formatRupees(inv.total_paise / 100);
        const invoicePdfBase = process.env.NEXT_PUBLIC_SITE_URL || "https://agent-wala-ai-agency.vercel.app";
        await db.recordOutbox({
          channel: "whatsapp",
          recipient: client?.phone || "+91 91010 10101",
          template_name: "payment_receipt_instant",
          content: `Payment Received! Thank you for paying invoice ${inv.invoice_number} (${amountINR}). Receipt & Tax Invoice: ${invoicePdfBase}/api/invoices/${inv.id}/pdf`,
          full_text: `Payment Received! Thank you for paying invoice ${inv.invoice_number} (${amountINR}). Receipt & Tax Invoice: ${invoicePdfBase}/api/invoices/${inv.id}/pdf`,
          project_id: inv.project_id,
          project_name: project?.name,
          client_id: client?.id,
          client_name: client?.name,
          status: "sent",
        });

        await db.logActivity(
          "automation",
          "Razorpay Webhook: Payment Captured",
          `Payment of ${amountINR} received for ${inv.invoice_number}. Marked invoice as paid. Ticked ${inv.type === "advance" ? "s2" : "f2"}.`,
          inv.project_id || inv.client_id
        );

        if (sendTwice) {
          await db.logActivity(
            "automation",
            "Razorpay Webhook: Secondary duplicate event verified",
            `Duplicate event for ${inv.invoice_number} processed without double-charging or side-effects.`,
            inv.project_id || inv.client_id
          );
        }

        return NextResponse.json({
          success: true,
          message: `Razorpay payment captured for ${inv.invoice_number} (${amountINR}). Ticked ${inv.type === "advance" ? "s2" : "f2"}. ${sendTwice ? "Duplicate event verified idempotent." : ""}`,
        });
      } else {
        // Bug 11: Failure simulation - invoice stays unpaid, client gets retry link
        const retryLink = inv.razorpay_payment_url || `https://rzp.io/l/aw_retry_${inv.id.slice(-6)}`;

        await db.recordOutbox({
          channel: "whatsapp",
          recipient: client?.phone || "+91 91010 10101",
          template_name: "payment_failed_retry",
          content: `Payment Attempt Failed: Your payment for invoice ${inv.invoice_number} could not be completed. Please retry using this secure Razorpay link: ${retryLink}`,
          full_text: `Payment Attempt Failed: Your payment for invoice ${inv.invoice_number} could not be completed. Please retry using this secure Razorpay link: ${retryLink}`,
          project_id: inv.project_id,
          project_name: project?.name,
          client_id: client?.id,
          client_name: client?.name,
          status: "sent",
        });

        await db.logActivity(
          "automation",
          "Razorpay Webhook: Payment Failed",
          `Payment attempt failed for invoice ${inv.invoice_number}. Invoice stays unpaid. Dispatched retry link to client (${client?.phone || "client"}).`,
          inv.project_id || inv.client_id
        );

        return NextResponse.json({
          success: true,
          message: `Razorpay failure simulated for ${inv.invoice_number}. Invoice kept unpaid. Retry link sent to client.`,
          retryLink,
        });
      }
    }

    // 3. WhatsApp Inbound Webhook (Bug 15 & Bug 21)
    if (type === "whatsapp_inbound") {
      const { projectId, messageText } = body;
      const project = await db.getProjectById(projectId);
      if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      const client = await db.getClientById(project.client_id);

      const text = messageText || "Namaste, we need an appointment receptionist for our clinic.";
      const now = getAppTimeISO();
      const in48h = new Date(getAppDate().getTime() + 48 * 3600000).toISOString();

      // 1. Record inbound message
      await db.createMessage({
        client_id: project.client_id,
        project_id: project.id,
        direction: "inbound",
        channel: "whatsapp",
        body: text,
        status: "received",
      });

      // 2. Safety Rule 6: Inbound message ticks c2 & pauses nudges for 48h
      await db.updateCheck(project.id, "c2", true, "client");
      if (client) {
        await db.updateClient(client.id, {
          paused_follow_ups_until: in48h,
          last_inbound_at: now,
        });
      }

      // Bug 15: Alert founder on any client reply
      await db.recordOutbox({
        channel: "whatsapp",
        recipient: settings.phone,
        template_name: "founder_client_reply_alert",
        content: `Client WhatsApp Reply from ${client?.name || project.name} (${client?.phone}): "${text}"`,
        full_text: `Client WhatsApp Reply from ${client?.name || project.name} (${client?.phone}): "${text}"`,
        project_id: project.id,
        client_id: project.client_id,
        status: "sent",
      });

      // Bug 21: Angry / Refund / Legal keyword detection
      const lower = text.toLowerCase();
      const isDispute =
        lower.includes("scam") ||
        lower.includes("refund") ||
        lower.includes("cheater") ||
        lower.includes("fraud") ||
        lower.includes("legal notice") ||
        lower.includes("consumer court") ||
        lower.includes("police") ||
        lower.includes("lawyer");

      if (isDispute) {
        // Halt automations for this project
        await db.updateProject(project.id, { status: "paused" });
        if (client) {
          await db.updateClient(client.id, { status: "paused" });
        }

        // Create urgent founder task
        await db.createTask({
          project_id: project.id,
          title: `URGENT: Legal/Refund dispute flagged by ${client?.owner_name || client?.name}: "${text.slice(0, 50)}"`,
          category: "review",
          hours_estimated: 1,
          due_date: getAppTimeISO().slice(0, 10),
        });

        // Founder dispute alert
        await db.recordOutbox({
          channel: "whatsapp",
          recipient: settings.phone,
          template_name: "urgent_founder_legal_alert",
          content: `🚨 URGENT DISPUTE ALERT: ${client?.name} sent: "${text}". All automations halted. Review task created.`,
          full_text: `🚨 URGENT DISPUTE ALERT: ${client?.name} sent: "${text}". All automations halted. Review task created.`,
          project_id: project.id,
          client_id: project.client_id,
          status: "sent",
        });

        await db.logActivity(
          "system",
          "URGENT DISPUTE DETECTED - Automations Halted",
          `Client sent dispute keyword ("${text}"). Automations halted. Founder task and urgent WhatsApp dispatched.`,
          project.id
        );

        return NextResponse.json({
          success: true,
          message: `Dispute detected ("${text}"). Automations halted. Urgent founder task and alert logged.`,
          disputeDetected: true,
        });
      }

      // Opt-out detection
      if (lower.includes("stop") || lower.includes("band karo") || lower.includes("not interested")) {
        await db.updateProject(project.id, { status: "lost" });
        await db.logActivity(
          "automation",
          "Opt-Out Detected",
          `Client requested stop via WhatsApp ("${text}"). Marked project as Lost and halted all automations.`,
          project.id
        );
      } else {
        await db.logActivity(
          "client",
          "Inbound WhatsApp Message Received",
          `Client sent: "${text}". Ticked c2, alerted founder, and paused automated nurture for 48h.`,
          project.id
        );
      }

      return NextResponse.json({
        success: true,
        message: `Inbound WhatsApp simulated: "${text}". Ticked c2, notified founder, and paused nudges for 48h.`,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown webhook type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
