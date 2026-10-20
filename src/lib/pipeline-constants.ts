import { PhaseDef, StageDef, ChecklistItemDef, Client, StageKey } from "./types";

export const PIPELINE_PHASES: PhaseDef[] = [
  {
    id: 0,
    name: "Find",
    stages: [
      {
        id: 0,
        name: "Lead",
        phaseId: 0,
        phaseName: "Find",
        items: [
          { key: "l1", label: "Business and owner name noted", who: "Auto (form)", isAutomation: true },
          { key: "l2", label: "Phone / WhatsApp saved", who: "Auto (form)", isAutomation: true },
          { key: "l3", label: "Pain spotted (missed calls, slow replies, no follow-up)", who: "AI suggests, human confirms", isAutomation: true },
        ],
      },
      {
        id: 1,
        name: "Contacted",
        phaseId: 0,
        phaseName: "Find",
        items: [
          { key: "c1", label: "First message, call or walk-in done", who: "Auto (welcome WhatsApp)", isAutomation: true },
          { key: "c2", label: "Owner replied or showed interest", who: "Auto (inbound reply webhook)", isAutomation: true },
        ],
      },
    ],
  },
  {
    id: 1,
    name: "Meet",
    stages: [
      {
        id: 2,
        name: "Meeting booked",
        phaseId: 1,
        phaseName: "Meet",
        items: [
          { key: "b1", label: "Date and time confirmed", who: "Auto (booking webhook)", isAutomation: true },
          { key: "b2", label: "Demo agent set up for their business type", who: "Auto (template clone)", isAutomation: true },
          { key: "b3", label: "Reminder sent the day before", who: "Auto (cron)", isAutomation: true },
        ],
      },
      {
        id: 3,
        name: "Meeting done",
        phaseId: 1,
        phaseName: "Meet",
        items: [
          { key: "m1", label: "Owner called the demo agent live", who: "Human" },
          { key: "m2", label: "Asked: calls per day, after-hours enquiries, current cost", who: "Human (meeting notes form)" },
          { key: "m3", label: "Recommended one package with price", who: "Human" },
          { key: "m4", label: "Next step agreed with a date", who: "Human" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Win",
    stages: [
      {
        id: 4,
        name: "Proposal sent",
        phaseId: 2,
        phaseName: "Win",
        items: [
          { key: "p1", label: "Proposal with package and ₹ price sent", who: "Auto after human approval", isAutomation: true },
          { key: "p2", label: "Followed up within 48 hours", who: "Auto (cron)", isAutomation: true },
        ],
      },
      {
        id: 5,
        name: "Won",
        phaseId: 2,
        phaseName: "Win",
        items: [
          { key: "w1", label: "Client said yes", who: "Auto (client clicks Accept)", isAutomation: true },
          { key: "w2", label: "50% setup advance received", who: "Auto (Razorpay webhook)", isAutomation: true },
          { key: "w3", label: "FAQs, prices and timings collected", who: "Auto (onboarding form submitted)", isAutomation: true },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Deliver",
    stages: [
      {
        id: 6,
        name: "Building",
        phaseId: 3,
        phaseName: "Deliver",
        items: [
          { key: "d1", label: "Agent built from template", who: "Auto (AI draft from onboarding data)", isAutomation: true },
          { key: "d2", label: "Tested on 50 real questions", who: "Auto (AI test run, pass rate ≥ 90%)", isAutomation: true },
          { key: "d3", label: "Client approved a test call", who: "Auto (client clicks Approve)", isAutomation: true },
        ],
      },
      {
        id: 7,
        name: "Live",
        phaseId: 3,
        phaseName: "Deliver",
        items: [
          { key: "v1", label: "Connected to their number / WhatsApp", who: "Human" },
          { key: "v2", label: "Client team trained on human handoff", who: "Human" },
          { key: "v3", label: "First-week transcript review done", who: "Auto (AI review report generated)", isAutomation: true },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Bill",
    stages: [
      {
        id: 8,
        name: "Final bill sent",
        phaseId: 4,
        phaseName: "Bill",
        items: [
          { key: "f1", label: "Final invoice sent (balance setup + month 1, with GST)", who: "Auto (when v1 + v2 done)", isAutomation: true },
        ],
      },
      {
        id: 9,
        name: "Paid",
        phaseId: 4,
        phaseName: "Bill",
        items: [
          { key: "q1", label: "Payment received", who: "Auto (Razorpay webhook)", isAutomation: true },
          { key: "q2", label: "Testimonial or Google review asked", who: "Auto (3 days after payment)", isAutomation: true },
        ],
      },
    ],
  },
];

export const ALL_STAGES: StageDef[] = PIPELINE_PHASES.flatMap((p) => p.stages);
export const ALL_CHECKLIST_ITEMS: ChecklistItemDef[] = ALL_STAGES.flatMap((s) => s.items);
export const TOTAL_CHECKLIST_COUNT = ALL_CHECKLIST_ITEMS.length; // 25 items

/**
 * Stage derivation algorithm:
 * "A client's stage is derived: it is the first stage whose checklist is not fully ticked.
 * Ticking the last item of a stage moves the client forward automatically."
 */
export function getClientStageIndex(client: Pick<Client, "checks">): number {
  const checks = client.checks || {};
  for (let i = 0; i < ALL_STAGES.length; i++) {
    const stage = ALL_STAGES[i];
    const isStageDone = stage.items.every((item) => checks[item.key]?.done);
    if (!isStageDone) {
      return i; // Current active stage
    }
  }
  return ALL_STAGES.length; // 10 = All stages completed!
}

export function getClientStageName(client: Pick<Client, "checks">): string {
  const idx = getClientStageIndex(client);
  if (idx >= ALL_STAGES.length) {
    return "Completed — paid";
  }
  return ALL_STAGES[idx].name;
}

export function getClientTickedCount(client: Pick<Client, "checks">): number {
  const checks = client.checks || {};
  return ALL_CHECKLIST_ITEMS.filter((item) => checks[item.key]?.done).length;
}

export function getClientProgressPercentage(client: Pick<Client, "checks">): number {
  const ticked = getClientTickedCount(client);
  return Math.round((ticked / TOTAL_CHECKLIST_COUNT) * 100);
}

