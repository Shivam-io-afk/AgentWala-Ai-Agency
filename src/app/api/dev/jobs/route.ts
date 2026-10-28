import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppDate, getAppTimeISO, getAppTimeIST, getAppISTHour } from "@/lib/clock";
import { getClientStageIndex } from "@/lib/pipeline-constants";
import { dispatchMessage } from "@/lib/messenger";
import { calculateMilestoneParts, formatINR } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const executed: string[] = [];
    const now = getAppDate();
    const todayStr = getAppTimeISO().slice(0, 10);
    const istHour = getAppISTHour();
    const settings = await db.getSettings();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agent-wala-ai-agency.vercel.app";

    // 1. Process explicit queued jobs
    const allJobs = await db.getJobs();
    const pendingJobs = allJobs.filter((j) => j.status === "pending");

    for (const job of pendingJobs) {
      job.status = "completed";
      job.updated_at = getAppTimeISO();
      executed.push(`Executed queued job: ${job.type} (${job.id})`);
    }

    // 2. Bug 14: Flush Held Quiet Hours Messages if now within business hours (09:00 - 21:00 IST)
    if (istHour >= 9 && istHour < 21) {
      const outbox = await db.getOutbox();
      let quietFlushed = 0;
      for (const item of outbox) {
        if (item.status === "held_quiet_hours") {
          item.status = "sent";
          item.created_at = getAppTimeISO();
          quietFlushed++;
        }
      }
      if (quietFlushed > 0) {
        executed.push(`Bug 14: Released ${quietFlushed} message(s) previously held during quiet hours.`);
      }
    }

    // 3. Scan projects for automated pipeline triggers based on virtual clock
    const projects = await db.getProjects();
    const clients = await db.getClients();

    for (const proj of projects) {
      const stageIdx = getClientStageIndex(proj);
      const client = clients.find((c) => c.id === proj.client_id) || null;
      if (!client) continue;

      const clientCreatedTime = new Date(client.created_at).getTime();
      const hoursSinceCreated = (now.getTime() - clientCreatedTime) / 3600000;

      // Bug 6: Lead Nurture Check (+24h & +72h with idempotency & 3-cap)
      // Only runs if in Stage 1, lead has not replied (c2) and not booked (b1)
      if (stageIdx === 1 && !proj.checks?.c2?.done && !proj.checks?.b1?.done && client.status !== "cold" && client.status !== "lost") {
        // +24h nurture
        if (hoursSinceCreated >= 24) {
          const res = await dispatchMessage({
            channel: "whatsapp",
            recipient: client.phone,
            templateName: "lead_nurture_24h",
            stepKey: "24h",
            fullText: `Hi ${client.owner_name || "there"}, Shivam here from AgentWala! Would you like to schedule a quick 10-min live demo call? Link: https://wa.me/919101010101`,
            projectId: proj.id,
            clientId: client.id,
            projectName: proj.name,
            clientName: client.name,
            isLeadNurture: true,
          });
          if (res.sent) {
            executed.push(`A4: Dispatched 24h lead nurture WhatsApp for ${proj.name}`);
          }
        }

        // +72h nurture
        if (hoursSinceCreated >= 72) {
          const res = await dispatchMessage({
            channel: "whatsapp",
            recipient: client.phone,
            templateName: "lead_nurture_72h",
            stepKey: "72h",
            fullText: `Namaste ${client.owner_name || "there"}! Just checking in — would you like to see a custom demo of our AI agent for ${client.name}? Pick a time here: https://cal.com/agentwala/demo`,
            projectId: proj.id,
            clientId: client.id,
            projectName: proj.name,
            clientName: client.name,
            isLeadNurture: true,
          });
          if (res.sent) {
            executed.push(`A4: Dispatched 72h lead nurture WhatsApp for ${proj.name}`);
          }
        }
      }

      // Bug 16: Meeting Reminders (-24h & -1h) and tick b3
      if (proj.checks?.b1?.done && proj.next_step_date) {
        // Estimate meeting time
        const meetingDateStr = proj.next_step_date; // e.g. "2026-10-21"
        const meetingTarget = new Date(`${meetingDateStr}T11:00:00+05:30`);
        const hoursToMeeting = (meetingTarget.getTime() - now.getTime()) / 3600000;

        // 24h reminder
        if (hoursToMeeting <= 24 && hoursToMeeting > 1) {
          const res = await dispatchMessage({
            channel: "whatsapp",
            recipient: client.phone,
            templateName: "meeting_reminder_24h",
            stepKey: `m24h_${meetingDateStr}`,
            fullText: `Namaste ${client.owner_name}! Reminder: Discovery meeting with AgentWala is tomorrow at 11:00 AM IST. Meet link: https://meet.google.com/aw-demo-call`,
            projectId: proj.id,
            clientId: client.id,
          });
          if (res.sent) {
            executed.push(`A6: Dispatched 24h meeting reminder for ${proj.name}`);
          }
        }

        // 1h reminder and tick b3
        if (hoursToMeeting <= 1 && hoursToMeeting >= -1) {
          const res = await dispatchMessage({
            channel: "whatsapp",
            recipient: client.phone,
            templateName: "meeting_reminder_1h",
            stepKey: `m1h_${meetingDateStr}`,
            fullText: `Namaste ${client.owner_name}! Our discovery meeting starts in 1 hour (11:00 AM IST). Google Meet link: https://meet.google.com/aw-demo-call`,
            projectId: proj.id,
            clientId: client.id,
          });
          if (res.sent) {
            await db.updateCheck(proj.id, "b3", true, "automation");
            executed.push(`A6: Dispatched 1h meeting reminder & ticked b3 for ${proj.name}`);
          }
        }
      }

      // Bug 19: Deemed Acceptance Engine (+3d, +6d reminders, +7d tick v3 and send final invoice)
      if (proj.checks?.w3?.done && !proj.checks?.v3?.done) {
        const deliveries = await db.getDeliveries(proj.id);
        const lastDelivery = deliveries[0];
        if (lastDelivery) {
          const deliveryTime = new Date(lastDelivery.delivered_at || (lastDelivery as any).created_at || now.toISOString()).getTime();
          const daysSinceDelivery = (now.getTime() - deliveryTime) / 86400000;

          // +3 days reminder
          if (daysSinceDelivery >= 3) {
            const res = await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "review_reminder_day3",
              stepKey: `del_3d_${lastDelivery.id}`,
              fullText: `Namaste ${client.owner_name}! Friendly reminder to test your build deliverables. 4 days remaining before deemed acceptance under Clause 4.4: ${siteUrl}/p/${client.portal_token}`,
              projectId: proj.id,
              clientId: client.id,
            });
            if (res.sent) {
              executed.push(`A14: Dispatched +3d review reminder for ${proj.name}`);
            }
          }

          // +6 days reminder
          if (daysSinceDelivery >= 6) {
            const res = await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "review_reminder_day6",
              stepKey: `del_6d_${lastDelivery.id}`,
              fullText: `Namaste ${client.owner_name}! Final notice: 24 hours remaining in your 7-day review window. Deliverables will be deemed accepted tomorrow: ${siteUrl}/p/${client.portal_token}`,
              projectId: proj.id,
              clientId: client.id,
            });
            if (res.sent) {
              executed.push(`A14: Dispatched +6d review reminder for ${proj.name}`);
            }
          }

          // +7 days -> Deemed accepted! Tick v3, tick f1, create final invoice
          if (daysSinceDelivery >= 7) {
            await db.updateCheck(proj.id, "v3", true, "automation");

            // Auto-generate Final Invoice
            const existingInvoices = await db.getInvoicesByClientId(client.id);
            const hasFinal = existingInvoices.some((i) => i.type === "final");
            let finalInv = existingInvoices.find((i) => i.type === "final");

            if (!hasFinal) {
              const projectPriceRupees = proj.price_paise ? Math.round(proj.price_paise / 100) : 35000;
              const milestonePlan = proj.milestone_plan || (projectPriceRupees > 100000 ? "40_30_30" : "50_50");
              const parts = calculateMilestoneParts(projectPriceRupees, milestonePlan);
              const finalRupees = parts[parts.length - 1];

              finalInv = await db.createInvoice({
                client_id: client.id,
                project_id: proj.id,
                type: "final",
                subtotal_paise: finalRupees * 100,
                razorpay_payment_url: `https://rzp.io/l/aw_fin_${client.id.slice(0, 6)}`,
                status: "sent",
              });
            }

            await db.updateCheck(proj.id, "f1", true, "automation");

            await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "deemed_acceptance_final_bill",
              stepKey: `del_7d_${lastDelivery.id}`,
              fullText: `Namaste ${client.owner_name}! 7-day review window completed. Deliverables are marked accepted (v3). Your final handover invoice of ${formatINR((finalInv?.total_paise || 0) / 100)} is ready: ${siteUrl}/p/${client.portal_token}`,
              projectId: proj.id,
              clientId: client.id,
            });

            executed.push(`A14: 7-day review timer expired. Marked v3 (Deemed Accepted), generated final invoice, and ticked f1 for ${proj.name}`);
          }
        }
      }

      // Bug 20: Monthly Care Plan Billing Engine
      // Generate invoice on 1st of month, reminders at +3/+7/+14d, alert founder at +14d
      if (proj.checks?.h3?.done || proj.status === "completed") {
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthKey = `${year}_${String(month).padStart(2, "0")}`;

        // 1st of month: generate invoice
        if (now.getDate() === 1) {
          const careKey = `${proj.id}_care_invoice_${monthKey}`;
          if (!db.hasIdempotencyKey(careKey)) {
            db.recordIdempotencyKey(careKey);
            const monthlyRupees = proj.monthly_paise ? Math.round(proj.monthly_paise / 100) : 1999;
            const careInv = await db.createInvoice({
              client_id: client.id,
              project_id: proj.id,
              type: "monthly",
              subtotal_paise: monthlyRupees * 100,
              razorpay_payment_url: `https://rzp.io/l/aw_care_${monthKey}_${client.id.slice(0, 6)}`,
              status: "sent",
            });

            await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "monthly_care_invoice",
              stepKey: monthKey,
              fullText: `Namaste ${client.owner_name}! Your monthly AgentWala Care Plan invoice for ${monthKey} (${formatINR(monthlyRupees)}) has been issued: ${siteUrl}/p/${client.portal_token}`,
              projectId: proj.id,
              clientId: client.id,
            });

            executed.push(`A19: 1st of Month - Generated monthly care plan invoice for ${proj.name}`);
          }
        }

        // Reminders for unpaid care invoices
        const invoices = await db.getInvoicesByClientId(client.id);
        const unpaidCareInvoices = invoices.filter((i) => i.type === "monthly" && i.status !== "paid");

        for (const careInv of unpaidCareInvoices) {
          const daysOverdue = (now.getTime() - new Date(careInv.created_at).getTime()) / 86400000;

          // +3d reminder
          if (daysOverdue >= 3) {
            const res = await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "care_plan_reminder_day3",
              stepKey: `care_3d_${careInv.id}`,
              fullText: `Namaste ${client.owner_name}! Gentle reminder: Monthly Care Plan invoice ${careInv.invoice_number} is due: ${careInv.razorpay_payment_url}`,
              projectId: proj.id,
              clientId: client.id,
            });
            if (res.sent) executed.push(`A19: Dispatched +3d care plan reminder for ${proj.name}`);
          }

          // +7d reminder
          if (daysOverdue >= 7) {
            const res = await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "care_plan_reminder_day7",
              stepKey: `care_7d_${careInv.id}`,
              fullText: `Namaste ${client.owner_name}! Monthly Care Plan invoice ${careInv.invoice_number} is 7 days overdue. Please settle to keep maintenance active: ${careInv.razorpay_payment_url}`,
              projectId: proj.id,
              clientId: client.id,
            });
            if (res.sent) executed.push(`A19: Dispatched +7d care plan reminder for ${proj.name}`);
          }

          // +14d reminder & founder alert
          if (daysOverdue >= 14) {
            const res = await dispatchMessage({
              channel: "whatsapp",
              recipient: client.phone,
              templateName: "care_plan_reminder_day14",
              stepKey: `care_14d_${careInv.id}`,
              fullText: `URGENT: Care Plan invoice ${careInv.invoice_number} is 14 days overdue. Maintenance and uptime monitoring may be paused: ${careInv.razorpay_payment_url}`,
              projectId: proj.id,
              clientId: client.id,
            });
            if (res.sent) {
              // Alert founder
              await db.recordOutbox({
                channel: "whatsapp",
                recipient: settings.phone,
                template_name: "founder_care_overdue_14d",
                content: `⚠️ OVERDUE ALERT: Client ${client.name} has not paid Care Plan invoice ${careInv.invoice_number} for 14 days. Please follow up directly.`,
                full_text: `⚠️ OVERDUE ALERT: Client ${client.name} has not paid Care Plan invoice ${careInv.invoice_number} for 14 days. Please follow up directly.`,
                project_id: proj.id,
                client_id: client.id,
                status: "sent",
              });
              executed.push(`A19: Overdue 14 days: Client notified and founder alerted for ${proj.name}`);
            }
          }
        }
      }
    }

    // 4. Bug 14: Daily Founder Digest (Runs ONLY at 09:00 IST)
    if (istHour === 9) {
      const digestKey = `digest_9am_${todayStr}`;
      if (!db.hasIdempotencyKey(digestKey)) {
        db.recordIdempotencyKey(digestKey);
        await db.recordAutomationRunEntry({
          automation_id: "A20",
          trigger: "schedule",
          project_name: "System",
          result: "success",
          output_or_error: `Executed 9:00 AM founder daily digest check (Virtual Time: ${getAppTimeIST()})`,
          retries: "0/3",
        });
        executed.push(`A20: Executed 9:00 AM founder daily digest check (Virtual Time: ${getAppTimeIST()})`);
      }
    }

    await db.logActivity(
      "system",
      "Dev Manual Job Execution",
      `Ran job queue at virtual time ${getAppTimeIST()}. Total actions processed: ${executed.length}.`
    );

    return NextResponse.json({
      success: true,
      jobsRan: executed.length,
      executed,
      virtualTimeIST: getAppTimeIST(),
      istHour,
    });
  } catch (err: any) {
    console.error("Jobs error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
