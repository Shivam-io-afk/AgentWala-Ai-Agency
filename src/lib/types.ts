/**
 * Core type definitions for AgentWala OS & Client Pipeline
 */

export type StageKey =
  | "l1" | "l2" | "l3"
  | "c1" | "c2"
  | "b1" | "b2" | "b3"
  | "m1" | "m2" | "m3" | "m4"
  | "p1" | "p2"
  | "w1" | "w2" | "w3"
  | "d1" | "d2" | "d3"
  | "v1" | "v2" | "v3"
  | "f1"
  | "q1" | "q2";

export interface ChecklistItemDef {
  key: StageKey;
  label: string;
  who: "Auto (form)" | "AI suggests, human confirms" | "Auto (welcome WhatsApp)" | "Auto (inbound reply webhook)" | "Auto (booking webhook)" | "Auto (template clone)" | "Auto (cron)" | "Human" | "Human (meeting notes form)" | "Auto after human approval" | "Auto (client clicks Accept)" | "Auto (Razorpay webhook)" | "Auto (onboarding form submitted)" | "Auto (AI draft from onboarding data)" | "Auto (AI test run, pass rate ≥ 90%)" | "Auto (client clicks Approve)" | "Auto (when v1 + v2 done)" | "Auto (3 days after payment)" | "Auto (AI review report generated)";
  isAutomation?: boolean;
}

export interface StageDef {
  id: number;
  name: string;
  phaseId: number;
  phaseName: string;
  items: ChecklistItemDef[];
}

export interface PhaseDef {
  id: number;
  name: string;
  stages: StageDef[];
}

export interface ClientCheckRecord {
  key: StageKey;
  done: boolean;
  done_at?: string;
  done_by: "user" | "automation" | "client";
}

export type ClientStatus = "active" | "cold" | "lost" | "completed";

export interface Client {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email?: string;
  city?: string;
  niche: string;
  package: string; // starter | growth | pro | creator
  founding_offer: boolean;
  notes?: string;
  next_step?: string;
  next_step_date?: string;
  status: ClientStatus;
  portal_token: string;
  consent_at?: string;
  source: string;
  is_example?: boolean;
  checks: Record<string, ClientCheckRecord>;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  type: "advance" | "final" | "monthly";
  subtotal_paise: number;
  gst_paise: number;
  total_paise: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  paid_at?: string;
  razorpay_payment_link_id?: string;
  razorpay_payment_url?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  client_id: string;
  version: number;
  package_id: string;
  setup_paise: number;
  monthly_paise: number;
  gst_paise: number;
  total_first_bill_paise: number;
  advance_paise: number;
  scope_bullets: string[];
  pdf_url?: string;
  status: "draft" | "sent" | "accepted" | "declined";
  accepted_at?: string;
  accepted_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRecord {
  id: string;
  client_id: string;
  niche: string;
  prompt: string;
  knowledge_base: string;
  test_report?: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    questions: {
      question: string;
      expected_behavior: string;
      agent_answer: string;
      passed: boolean;
      language: "Hindi" | "English" | "Hinglish";
    }[];
  };
  status: "draft" | "testing" | "approved" | "live";
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  client_id: string;
  direction: "inbound" | "outbound";
  channel: "whatsapp" | "email";
  template?: string;
  body: string;
  status: "sent" | "delivered" | "received" | "failed";
  created_at: string;
}

export interface JobRecord {
  id: string;
  type: string;
  client_id?: string;
  payload?: any;
  run_at: string;
  attempts: number;
  max_attempts: number;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogRecord {
  id: string;
  client_id?: string;
  actor: "user" | "automation" | "client" | "system";
  action: string;
  detail: string;
  created_at: string;
}

export interface AutomationSetting {
  id: string; // e.g. "A1", "A2", ...
  name: string;
  description: string;
  enabled: boolean;
  last_run?: string;
  success_count: number;
  failure_count: number;
}
