import { db } from "./db";
import { Client, Recommendation } from "./types";
import { getClientStageIndex, ALL_STAGES } from "./pipeline-constants";
import { calculateBill, formatINR } from "./pricing";

/**
 * AI Copilot Engine for Agmeta OS (Section 7b)
 * Generates plain Hinglish (or English) recommendations for the founder.
 */
export async function runCopilotAudit(): Promise<Recommendation[]> {
  const clients = await db.getClients();
  const invoices = await db.getInvoices();
  const settings = await db.getSettings();
  const lang = settings.copilot_language || "hinglish";
  const isHinglish = lang === "hinglish";

  const generated: Partial<Recommendation>[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  for (const client of clients) {
    if (client.status === "lost" || client.status === "cold") continue;

    const stageIdx = getClientStageIndex(client);
    const checks = client.checks || {};
    const b = calculateBill(client.package, client.founding_offer);
    const createdAgeDays = Math.floor((now - new Date(client.created_at).getTime()) / dayMs);

    // 1. FORGOTTEN STEPS CHECK
    // Lead > 2 days
    if (stageIdx === 0 && createdAgeDays >= 2) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "forgotten_step",
        title: isHinglish
          ? `${client.name} lead 2 din se pending hai. Call karo!`
          : `Lead ${client.name} has been pending for 2 days. Make contact.`,
        reason: isHinglish
          ? `Lead form aaye hue ${createdAgeDays} din ho gaye hain par phone ya WhatsApp connect nahi hua. Jaldi call karne par conversion 3x badhta hai.`
          : `Lead has been waiting for ${createdAgeDays} days without contact. Reaching out quickly triples conversions.`,
        why_rule: "Rule 1: Lead stage stuck longer than normal threshold (2 days).",
        action_label: isHinglish ? "Lead ko WhatsApp karo" : "Send WhatsApp",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "high",
        money_at_risk_rupees: b.totalFirstBill,
      });
    }

    // Contacted > 3 days
    if (stageIdx === 1 && createdAgeDays >= 3) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "forgotten_step",
        title: isHinglish
          ? `${client.owner_name || client.name} ko meeting link bhejo`
          : `Send 20-min demo invite to ${client.owner_name || client.name}`,
        reason: isHinglish
          ? `First message gaya hua hai par meeting book nahi hui. 20-min demo slot suggest karo.`
          : `First message sent but no demo booked. Propose two specific meeting times.`,
        why_rule: "Rule 1: Contacted stage duration > 3 days.",
        action_label: isHinglish ? "Open Client Page" : "Open Client",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "medium",
        money_at_risk_rupees: b.totalFirstBill,
      });
    }

    // Meeting booked past date with no notes
    if (stageIdx === 2 && client.next_step_date) {
      const isPast = new Date(client.next_step_date).getTime() < now - dayMs;
      if (isPast && !checks.m1?.done) {
        generated.push({
          client_id: client.id,
          client_name: client.name,
          type: "forgotten_step",
          title: isHinglish
            ? `${client.name} meeting ho gayi? Notes record karo (H1)`
            : `Meeting completed for ${client.name}? Record notes (H1)`,
          reason: isHinglish
            ? `Scheduled meeting date nikal chuki hai. Call ke 4 sawaal fill karo taaki AI proposal draft bana sake.`
            : `Meeting date has passed. Record the 4 call answers so AI can draft the proposal.`,
          why_rule: "Rule 1: Meeting booked past its scheduled date without completed meeting notes.",
          action_label: isHinglish ? "Record Meeting Notes" : "Record Notes",
          action_type: "navigate",
          action_payload: { url: `/admin/clients/${client.id}` },
          priority: "high",
          money_at_risk_rupees: b.totalFirstBill,
        });
      }
    }

    // Proposal > 5 days unaccepted
    if (stageIdx === 4) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "money_at_risk",
        title: isHinglish
          ? `Proposal sent to ${client.name} — 5 din ho gaye!`
          : `Proposal sent to ${client.name} pending > 5 days`,
        reason: isHinglish
          ? `₹${b.totalFirstBill} ka deal atka hai. Ek polite WhatsApp check-in bhej kar doubt solve karo.`
          : `₹${b.totalFirstBill} proposal awaiting sign-off. Send polite check-in message.`,
        why_rule: "Rule 4: Money at risk — proposal sent > 5 days without acceptance.",
        action_label: isHinglish ? "Follow-up WhatsApp Bhejo" : "Send Follow-up",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "high",
        money_at_risk_rupees: b.totalFirstBill,
      });
    }

    // Won > 2 days without onboarding form
    if (stageIdx === 5 && checks.w2?.done && !checks.w3?.done) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "forgotten_step",
        title: isHinglish
          ? `${client.name} ne advance de diya, intake form abhi pending hai!`
          : `Advance paid by ${client.name}, onboarding form pending`,
        reason: isHinglish
          ? `Client ne ₹${b.advance} pay kar diya hai par clinic timings aur doctor FAQs form abhi submit nahi kiya. WhatsApp par link re-send karo.`
          : `Client paid advance but has not completed intake form. Re-send portal onboarding link.`,
        why_rule: "Rule 1: Won stage > 2 days without onboarding intake (w3).",
        action_label: isHinglish ? "Send Portal Link" : "Send Intake Link",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "high",
        money_at_risk_rupees: b.finalBill,
      });
    }

    // 2. SKIPPED ITEMS CHECK
    // If proposal sent but meeting questions m2 never recorded
    if (checks.p1?.done && !checks.m2?.done) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "skipped_item",
        title: isHinglish
          ? `${client.name} ke call volume details missing hain!`
          : `Missing call volume info for ${client.name}`,
        reason: isHinglish
          ? `Proposal chala gaya hai par call volume aur after-hours enquiries ka data note nahi kiya. Agent build karte waqt zaroorat padegi.`
          : `Proposal sent without recording call metrics (m2). Needed to calibrate agent capacity.`,
        why_rule: "Rule 2: Earlier checklist item skipped while subsequent stage completed.",
        action_label: isHinglish ? "Fill Missing Data" : "Fill Details",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "medium",
      });
    }

    // 3. MISSING DATA CHECK
    if (!client.next_step_date && stageIdx < 10) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "missing_data",
        title: isHinglish
          ? `${client.name} ka next step date set nahi hai`
          : `Set next step date for ${client.name}`,
        reason: isHinglish
          ? `Bina next step date ke deal cold ho sakti hai. Ek date fix karo.`
          : `Deals without clear follow-up dates slip through the cracks.`,
        why_rule: "Rule 3: Missing next_step_date field on active client.",
        action_label: isHinglish ? "Set Next Date" : "Set Date",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "medium",
      });
    }

    // 4. MONEY AT RISK: Invoices overdue
    const clientInvoices = invoices.filter((i) => i.client_id === client.id);
    const overdueInv = clientInvoices.find((i) => i.status !== "paid" && i.due_date < new Date().toISOString().slice(0, 10));
    if (overdueInv) {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "money_at_risk",
        title: isHinglish
          ? `Invoice ${overdueInv.invoice_number} overdue hai!`
          : `Invoice ${overdueInv.invoice_number} is overdue`,
        reason: isHinglish
          ? `${formatINR(overdueInv.total_paise / 100)} ka invoice overdue date paar kar chuka hai. WhatsApp par reminder link bhej do.`
          : `Payment of ${formatINR(overdueInv.total_paise / 100)} is past due date. Send reminder nudge.`,
        why_rule: "Rule 4: Invoice past due date with unpaid status.",
        action_label: isHinglish ? "Payment Link Bhejo" : "Send Reminder",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "high",
        money_at_risk_rupees: overdueInv.total_paise / 100,
      });
    }

    // 6. UPSELL CHANCES
    if (stageIdx >= 8 && client.package === "starter") {
      generated.push({
        client_id: client.id,
        client_name: client.name,
        type: "upsell",
        title: isHinglish
          ? `${client.name} ko Growth plan (AI Voice) suggest karo`
          : `Suggest Growth package (Voice Agent) to ${client.name}`,
        reason: isHinglish
          ? `WhatsApp agent active hai aur volume badh raha hai. Phone receptionist add karne par Monthly MRR ₹12,000 badhega.`
          : `Client is active on Starter WhatsApp bot. Upgrading to voice receptionist adds ₹12,000/mo MRR.`,
        why_rule: "Rule 6: Upsell chance — high volume Starter client eligible for Voice Receptionist.",
        action_label: isHinglish ? "Pitch Growth Plan" : "Pitch Upgrade",
        action_type: "navigate",
        action_payload: { url: `/admin/clients/${client.id}` },
        priority: "low",
        money_at_risk_rupees: 19999,
      });
    }
  }

  // 7. BUSINESS COACHING (Monday Coaching)
  const targetClients = settings.target_clients_month_3 || 5;
  const currentLive = clients.filter((c) => getClientStageIndex(c) >= 8).length;
  generated.push({
    type: "coaching",
    title: isHinglish
      ? `Weekly Coaching: ${currentLive}/${targetClients} live clients`
      : `Weekly Coaching: ${currentLive}/${targetClients} live clients towards Goal`,
    reason: isHinglish
      ? `Target Month 3 mein 5 clients ka hai. Niche analysis: Dental clinics show fastest 7-day closing. Is hafte 2 demo calls complete karo.`
      : `Target is 5 live clients by Month 3. Focus on dental clinics which have demonstrated the shortest sales cycle.`,
    why_rule: "Rule 7: Weekly business coaching comparison against targets in settings.",
    action_label: isHinglish ? "View Pipeline Funnel" : "View Funnel",
    action_type: "navigate",
    action_payload: { url: "/admin/pipeline" },
    priority: "medium",
  });

  // 8. LEARNING TIPS
  if (clients.length <= 5) {
    generated.push({
      type: "learning_tip",
      title: isHinglish
        ? `Kaise Karein: Demo meeting mein "Mehenga hai" objection handle karna`
        : `How-To: Handling the "Too expensive" objection on demo calls`,
      reason: isHinglish
        ? `Clinic owner ko samjhao ki ₹14-18k front-desk hire sirf 1 shift karta hai, jabki Agmeta 24x7 dono lines par Hindi aur English answer karta hai.`
        : `Anchor against the ₹14-18k monthly cost of a single front desk shift that handles only one call at a time.`,
      why_rule: "Rule 8: Early-stage agency coaching tip for first 5 client pitches.",
      action_label: isHinglish ? "Read Sales Script" : "Read Script",
      action_type: "navigate",
      action_payload: { url: "/admin/templates" },
      priority: "low",
    });
  }

  // Rank by money at risk and priority (high > medium > low)
  const priorityScore = { high: 3, medium: 2, low: 1 };
  const sorted = generated
    .sort((a, b) => {
      const scoreDiff = (priorityScore[b.priority || "low"] || 0) - (priorityScore[a.priority || "low"] || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.money_at_risk_rupees || 0) - (a.money_at_risk_rupees || 0);
    })
    .slice(0, 7); // Max 7 items

  return sorted as Recommendation[];
}

