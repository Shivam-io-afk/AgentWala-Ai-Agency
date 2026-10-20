import { db } from "./db";
import { Client } from "./types";

export interface OutboundMessageRequest {
  clientId: string;
  channel: "whatsapp" | "email";
  body: string;
  automationId?: string;
  step?: string;
  isReceiptOrReminder?: boolean;
}

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  isShadow?: boolean;
  queuedForMorning?: boolean;
  morningTimeIST?: string;
}

/**
 * Enforces the 9 Safety Rules before any automated outbound message or stage modification
 */
export async function evaluateSafetyRules(
  req: OutboundMessageRequest
): Promise<SafetyCheckResult> {
  const settings = await db.getSettings();

  // Rule 1: Global Kill Switch
  if (settings.pause_all_outbound) {
    await db.logActivity(
      "system",
      "Blocked by Global Kill Switch",
      `Outbound ${req.channel} to client ${req.clientId} blocked: 'Pause all outbound messages' is ACTIVE.`,
      req.clientId
    );
    return {
      allowed: false,
      reason: "Global kill switch active: all outbound messaging is paused.",
    };
  }

  // Automation Specific checks
  if (req.automationId) {
    const automations = await db.getAutomations();
    const auto = automations.find((a) => a.id === req.automationId);

    // Rule 1: Automation Kill Switch
    if (auto && !auto.enabled) {
      await db.logActivity(
        "system",
        "Blocked by Automation Kill Switch",
        `Automation ${req.automationId} is disabled by user.`,
        req.clientId
      );
      return { allowed: false, reason: `Automation ${req.automationId} is disabled.` };
    }

    // Rule 2: Shadow Mode Check
    if (auto && auto.shadow_mode) {
      await db.logActivity(
        "automation",
        `[SHADOW MODE] ${auto.name}`,
        `Simulated message: "${req.body.slice(0, 60)}..." (Nothing was sent to client).`,
        req.clientId,
        { shadow: true, trigger_event: `automation_${req.automationId}` }
      );
      return {
        allowed: false,
        isShadow: true,
        reason: `Automation ${req.automationId} is running in Shadow Mode (simulation only).`,
      };
    }
  }

  // Client-specific limits
  const client = await db.getClientById(req.clientId);
  if (!client) {
    return { allowed: false, reason: "Client not found." };
  }

  // Rule 5: Stop when client speaks (Inbound pause check)
  if (client.paused_follow_ups_until) {
    const pauseEnd = new Date(client.paused_follow_ups_until).getTime();
    if (Date.now() < pauseEnd) {
      await db.logActivity(
        "system",
        "Suppressed: Client Spoke Rule",
        `Client ${client.name} recently messaged. Follow-ups paused until ${client.paused_follow_ups_until}.`,
        client.id
      );
      return {
        allowed: false,
        reason: `Client recently messaged. Automatic follow-ups paused for 48h.`,
      };
    }
  }

  // Rule 4: Max 3 outbound messages to a non-responding lead
  const messages = await db.getMessages(client.id);
  const hasInbound = messages.some((m) => m.direction === "inbound");
  if (!hasInbound && (client.outbound_count || 0) >= 3 && !req.isReceiptOrReminder) {
    // Mark cold / stop
    await db.updateClient(client.id, { status: "cold" });
    await db.logActivity(
      "system",
      "Lead Marked Cold (Max 3 Messages Rule)",
      `Sent 3 outbound messages without response. Marked Cold and stopped nudges for ${client.name}.`,
      client.id
    );
    return {
      allowed: false,
      reason: "Maximum 3 outbound messages sent without reply. Lead marked cold.",
    };
  }

  // Rule 4: No messages between 9 PM and 9 AM IST (Quiet Hours)
  const now = new Date();
  // IST offset is UTC + 5:30
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istMinutesTotal = (utcHours * 60 + utcMinutes + 330) % 1440;
  const istHour = Math.floor(istMinutesTotal / 60);

  const isQuietHours = istHour >= 21 || istHour < 9; // 9 PM to 9 AM
  if (isQuietHours && !req.isReceiptOrReminder) {
    await db.logActivity(
      "system",
      "Queued for 9 AM IST (Quiet Hours Rule)",
      `Message outside 9 AM - 9 PM IST window. Queued for delivery at 9:00 AM IST tomorrow.`,
      client.id
    );
    return {
      allowed: false,
      queuedForMorning: true,
      morningTimeIST: "09:00 AM IST",
      reason: "Quiet hours active (9 PM to 9 AM IST). Queued for morning.",
    };
  }

  return { allowed: true };
}

/**
 * Rule 5: Evaluates inbound client message for opt-out or sentiment
 */
export async function evaluateInboundMessage(clientId: string, text: string): Promise<void> {
  const clean = text.toLowerCase().trim();
  const optOutWords = ["stop", "band karo", "not interested", "unsubscribe", "don't call", "mat karo"];
  const isOptOut = optOutWords.some((w) => clean.includes(w));

  const now = new Date();
  const pauseUntil = new Date(Date.now() + 48 * 3600000).toISOString();

  if (isOptOut) {
    await db.updateClient(clientId, {
      status: "lost",
      notes: `[Auto Opt-Out]: Client replied with opt-out phrase "${text}". Marked lost.`,
    });
    await db.logActivity(
      "client",
      "Client Opted Out",
      `Inbound message "${text}" matched STOP/opt-out keywords. Marked Lost and halted automations.`,
      clientId
    );
  } else {
    // Normal client reply: pause follow-ups for 48h, tick c2
    await db.updateClient(clientId, {
      last_inbound_at: now.toISOString(),
      paused_follow_ups_until: pauseUntil,
    });
    await db.updateCheck(clientId, "c2", true, "automation");
    await db.logActivity(
      "client",
      "Client Replied (c2 ticked, 48h pause applied)",
      `Inbound message received: "${text.slice(0, 50)}...". Paused pending nudges for 48 hours.`,
      clientId
    );
  }
}

/**
 * Rule 6: Check AI confidence and safety
 */
export function checkAIConfidence(
  confidence: number,
  output: string
): { safe: boolean; reason?: string } {
  if (confidence < 0.8) {
    return {
      safe: false,
      reason: `AI confidence score (${confidence}) is below the required 0.8 threshold.`,
    };
  }

  const riskyKeywords = [
    "lawsuit",
    "police",
    "court",
    "fraud",
    "complaint",
    "refund",
    "angry",
    "gussa",
    "cheater",
    "prescription",
    "medical diagnosis",
  ];

  const lower = output.toLowerCase();
  const found = riskyKeywords.find((k) => lower.includes(k));
  if (found) {
    return {
      safe: false,
      reason: `AI response flagged sensitive topic / risk keyword: "${found}". Human review required.`,
    };
  }

  return { safe: true };
}

