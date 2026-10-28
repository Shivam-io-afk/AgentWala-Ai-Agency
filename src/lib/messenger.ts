import { db } from "./db";
import { getAppDate, getAppTimeISO, getAppISTHour } from "./clock";
import { OutboxItem } from "./types";

export interface DispatchMessageOptions {
  channel: "whatsapp" | "email" | "sms";
  recipient: string;
  templateName: string;
  stepKey?: string;
  fullText: string;
  projectId?: string;
  clientId?: string;
  projectName?: string;
  clientName?: string;
  isLeadNurture?: boolean;
  bypassQuietHours?: boolean; // e.g. for user-initiated OTP or payment confirmation
}

export interface DispatchResult {
  sent: boolean;
  status: "sent" | "queued" | "held_quiet_hours" | "shadow_mode" | "blocked" | "duplicate";
  reason?: string;
  idempotencyKey?: string;
  outboxItem?: OutboxItem;
}

/**
 * Centralized, idempotent message dispatcher for Agmeta OS (v2)
 * Enforces:
 * - Unique idempotency keys (Bug 6)
 * - 3-cap lead message limit -> mark Cold (Bug 6)
 * - Global kill switch queueing & resume flush (Bug 7)
 * - Shadow mode logging (Bug 13)
 * - Quiet hours (21:00-09:00 IST) (Bug 14)
 */
export async function dispatchMessage(options: DispatchMessageOptions): Promise<DispatchResult> {
  const step = options.stepKey || "1";
  const targetId = options.projectId || options.clientId || "sys";
  const idempotencyKey = `${targetId}_${options.templateName}_${step}`;

  // 1. Idempotency Check (Bug 6)
  if (db.hasIdempotencyKey(idempotencyKey)) {
    return {
      sent: false,
      status: "duplicate",
      reason: `Message with idempotency key ${idempotencyKey} already dispatched.`,
      idempotencyKey,
    };
  }

  // 2. Lead Nurture Rules (Bug 6)
  if (options.isLeadNurture && (options.clientId || options.projectId)) {
    const client = options.clientId ? await db.getClientById(options.clientId) : null;
    if (client) {
      // If client booked, replied or past lead, stop nurture
      if (client.checks?.b1?.done || client.checks?.c2?.done || client.status === "cold" || client.status === "lost") {
        return {
          sent: false,
          status: "blocked",
          reason: `Lead nurture stopped: Client already booked, replied, or marked ${client.status}.`,
        };
      }

      // 3 outbound unanswered -> mark Cold
      const currentOutbound = client.outbound_count || 0;
      if (currentOutbound >= 3) {
        await db.updateClient(client.id, { status: "cold" });
        await db.logActivity(
          "automation",
          "Lead Marked Cold (3-Cap Exceeded)",
          `Lead reached 3 outbound messages without response. Marked as Cold and stopped nurture.`,
          client.id
        );
        return {
          sent: false,
          status: "blocked",
          reason: "Outbound 3-cap reached without response. Marked as Cold.",
        };
      }
    }
  }

  // 3. Shadow Mode Check (Bug 13)
  const automations = await db.getAutomations();
  const matchingAuto = automations.find((a) => a.name.toLowerCase().includes(options.templateName.toLowerCase()));
  if (matchingAuto?.shadow_mode) {
    db.recordIdempotencyKey(idempotencyKey);
    await db.logActivity(
      "automation",
      `[SHADOW MODE] Would send ${options.channel.toUpperCase()}`,
      `[SHADOW MODE] To: ${options.recipient}\nTemplate: ${options.templateName}\nText: "${options.fullText}"`,
      options.clientId
    );
    return {
      sent: false,
      status: "shadow_mode",
      reason: "Shadow mode active: Logged full text, no message recorded to outbox.",
      idempotencyKey,
    };
  }

  // 4. Kill Switch Check (Bug 7)
  const settings = await db.getSettings();
  if (settings.pause_all_outbound) {
    db.recordIdempotencyKey(idempotencyKey);
    const item = await db.recordOutbox({
      channel: options.channel,
      recipient: options.recipient,
      template_name: options.templateName,
      content: options.fullText,
      full_text: options.fullText,
      project_id: options.projectId,
      client_id: options.clientId,
      project_name: options.projectName,
      client_name: options.clientName,
      status: "queued",
      idempotency_key: idempotencyKey,
    });
    return {
      sent: false,
      status: "queued",
      reason: "Global kill switch active: Message queued for release upon resume.",
      idempotencyKey,
      outboxItem: item,
    };
  }

  // 5. Quiet Hours Check: 21:00 to 09:00 IST (Bug 14)
  const istHour = getAppISTHour();
  const isQuietHours = istHour < 9 || istHour >= 21;

  if (isQuietHours && !options.bypassQuietHours) {
    db.recordIdempotencyKey(idempotencyKey);
    const item = await db.recordOutbox({
      channel: options.channel,
      recipient: options.recipient,
      template_name: options.templateName,
      content: options.fullText,
      full_text: options.fullText,
      project_id: options.projectId,
      client_id: options.clientId,
      project_name: options.projectName,
      client_name: options.clientName,
      status: "held_quiet_hours",
      idempotency_key: idempotencyKey,
    });
    return {
      sent: false,
      status: "held_quiet_hours",
      reason: `Quiet hours active (21:00-09:00 IST). Message held until 9 AM IST.`,
      idempotencyKey,
      outboxItem: item,
    };
  }

  // 6. Normal Dispatch
  db.recordIdempotencyKey(idempotencyKey);
  const item = await db.recordOutbox({
    channel: options.channel,
    recipient: options.recipient,
    template_name: options.templateName,
    content: options.fullText,
    full_text: options.fullText,
    project_id: options.projectId,
    client_id: options.clientId,
    project_name: options.projectName,
    client_name: options.clientName,
    status: "sent",
    idempotency_key: idempotencyKey,
  });

  // Increment outbound_count if client message
  if (options.clientId) {
    const client = await db.getClientById(options.clientId);
    if (client) {
      await db.updateClient(client.id, {
        outbound_count: (client.outbound_count || 0) + 1,
      });
    }
  }

  return {
    sent: true,
    status: "sent",
    idempotencyKey,
    outboxItem: item,
  };
}
