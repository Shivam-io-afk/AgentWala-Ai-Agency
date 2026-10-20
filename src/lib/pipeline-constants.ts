import { PhaseDef, StageDef, ChecklistItemDef, Client, Project, StageKey } from "./types";

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
          { key: "l1", label: "Name, business and need captured", who: "Auto (form)", isAutomation: true },
          { key: "l2", label: "WhatsApp number and consent saved", who: "Auto (form)", isAutomation: true },
          { key: "l3", label: "Budget and timeline captured", who: "Auto (form)", isAutomation: true },
        ],
      },
      {
        id: 1,
        name: "Qualified",
        phaseId: 0,
        phaseName: "Find",
        items: [
          { key: "c1", label: "Welcome message sent with booking link", who: "Auto", isAutomation: true },
          { key: "c2", label: "Lead replied or booked", who: "Auto (webhook)", isAutomation: true },
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
          { key: "b1", label: "Date and time confirmed", who: "Auto (Cal.com)", isAutomation: true },
          { key: "b2", label: "Pre-meeting brief ready (research, questions, suggested package)", who: "Auto (AI)", isAutomation: true },
          { key: "b3", label: "Reminders sent (24 h and 1 h)", who: "Auto", isAutomation: true },
        ],
      },
      {
        id: 3,
        name: "Requirements final",
        phaseId: 1,
        phaseName: "Meet",
        items: [
          { key: "r1", label: "Meeting done", who: "Founder" },
          { key: "r2", label: "Requirements form filled (features, pages/screens, deadline, budget)", who: "Founder (AI pre-fill)" },
          { key: "r3", label: "Scope and price agreed in the meeting", who: "Founder" },
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
          { key: "p1", label: "Scope of Work + quote generated and approved by founder", who: "Auto draft → founder taps Approve" },
          { key: "p2", label: "Agreement + quote sent to client portal", who: "Auto", isAutomation: true },
          { key: "p3", label: "Followed up at 48 h", who: "Auto", isAutomation: true },
        ],
      },
      {
        id: 5,
        name: "Signed and paid",
        phaseId: 2,
        phaseName: "Win",
        items: [
          { key: "s1", label: "Agreement accepted (name + OTP, or Aadhaar eSign)", who: "Auto (client)", isAutomation: true },
          { key: "s2", label: "Advance received", who: "Auto (Razorpay)", isAutomation: true },
          { key: "s3", label: "Kickoff: client content, logins and assets received", who: "Auto (portal uploads checklist)", isAutomation: true },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Build",
    stages: [
      {
        id: 6,
        name: "In progress",
        phaseId: 3,
        phaseName: "Build",
        items: [
          { key: "w1", label: "Work plan and milestones created from the scope", who: "Auto", isAutomation: true },
          { key: "w2", label: "Build complete", who: "Founder" },
          { key: "w3", label: "Delivery shared (staging link / test number / demo build)", who: "Founder uploads → auto notifies client" },
        ],
      },
      {
        id: 7,
        name: "Review",
        phaseId: 3,
        phaseName: "Build",
        items: [
          { key: "v1", label: "Revision round 1 closed (or skipped)", who: "Founder does work, auto tracks" },
          { key: "v2", label: "Revision round 2 closed (or skipped)", who: "Founder does work, auto tracks" },
          { key: "v3", label: "Client approved (or deemed accepted after 7 days)", who: "Auto (client / timer)", isAutomation: true },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Handover",
    stages: [
      {
        id: 8,
        name: "Final payment",
        phaseId: 4,
        phaseName: "Handover",
        items: [
          { key: "f1", label: "Final invoice sent", who: "Auto", isAutomation: true },
          { key: "f2", label: "Final payment received", who: "Auto (Razorpay)", isAutomation: true },
        ],
      },
      {
        id: 9,
        name: "Handed over",
        phaseId: 4,
        phaseName: "Handover",
        items: [
          { key: "h1", label: "Handover kit delivered (Annex B)", who: "Auto kit + founder confirms access transfer" },
          { key: "h2", label: "Client confirmed receipt in portal", who: "Auto (client)", isAutomation: true },
          { key: "h3", label: "Warranty, care plan / retainer and review request started", who: "Auto", isAutomation: true },
        ],
      },
    ],
  },
];

export const ALL_STAGES: StageDef[] = PIPELINE_PHASES.flatMap((p) => p.stages);
export const ALL_CHECKLIST_ITEMS: ChecklistItemDef[] = ALL_STAGES.flatMap((s) => s.items);
export const TOTAL_CHECKLIST_COUNT = ALL_CHECKLIST_ITEMS.length; // 27 items in v2

// Helper map to translate legacy v1 keys to v2 keys
export const LEGACY_KEY_MAP: Record<string, StageKey> = {
  m1: "r1",
  m2: "r2",
  m3: "r3",
  m4: "r3",
  w1: "s1",
  w2: "s2",
  w3: "s3",
  d1: "w1",
  d2: "w2",
  d3: "w3",
  q1: "f2",
  q2: "h3",
};

/**
 * Stage derivation algorithm (Section 6):
 * "The stage is derived: the first stage whose checklist is not complete.
 * Ticking the last item moves the project forward automatically."
 */
export function getClientStageIndex(clientOrProject: { checks?: Record<string, { done?: boolean }> } | null | undefined): number {
  if (!clientOrProject || !clientOrProject.checks) return 0;
  const checks = clientOrProject.checks;

  // Normalized check lookup with legacy fallback
  const isKeyDone = (key: string): boolean => {
    if (checks[key]?.done) return true;
    // Check legacy aliases
    for (const [legacy, v2Key] of Object.entries(LEGACY_KEY_MAP)) {
      if (v2Key === key && checks[legacy]?.done) return true;
    }
    return false;
  };

  // Bug 12: Furthest stage derived properly
  // If all 10 stages complete, return 10
  const allStagesDone = ALL_STAGES.every((stage) => stage.items.every((item) => isKeyDone(item.key)));
  if (allStagesDone) return 10;

  // Find the furthest stage reached
  let furthest = 0;
  for (let i = 0; i < ALL_STAGES.length; i++) {
    const stage = ALL_STAGES[i];
    const hasAnyDone = stage.items.some((item) => isKeyDone(item.key));
    const allItemsDone = stage.items.every((item) => isKeyDone(item.key));
    if (hasAnyDone) {
      furthest = Math.max(furthest, i);
    }
    if (allItemsDone && i + 1 < ALL_STAGES.length) {
      furthest = Math.max(furthest, i + 1);
    }
  }

  return furthest;
}

export function getClientStageName(clientOrProject: { checks?: Record<string, { done?: boolean }> } | null | undefined): string {
  const idx = getClientStageIndex(clientOrProject);
  if (idx >= 10) return "Completed";
  return ALL_STAGES[idx]?.name || "Lead";
}

export function getClientPhaseName(clientOrProject: { checks?: Record<string, { done?: boolean }> } | null | undefined): string {
  const idx = getClientStageIndex(clientOrProject);
  if (idx >= 10) return "Handover";
  return ALL_STAGES[idx]?.phaseName || "Find";
}

export function getClientProgressPercent(clientOrProject: { checks?: Record<string, { done?: boolean }> } | null | undefined): number {
  if (!clientOrProject || !clientOrProject.checks) return 0;
  const checks = clientOrProject.checks;
  let doneCount = 0;

  for (const item of ALL_CHECKLIST_ITEMS) {
    if (checks[item.key]?.done) {
      doneCount++;
    } else {
      // Check legacy mapping
      for (const [legacy, v2Key] of Object.entries(LEGACY_KEY_MAP)) {
        if (v2Key === item.key && checks[legacy]?.done) {
          doneCount++;
          break;
        }
      }
    }
  }

  return Math.round((doneCount / TOTAL_CHECKLIST_COUNT) * 100);
}

export const getClientProgressPercentage = getClientProgressPercent;
