/**
 * Core type definitions for AgentWala OS (v2) & Client Pipeline
 */

export type StageKey =
  // Stage 1: Lead (Phase: Find)
  | "l1" | "l2" | "l3"
  // Stage 2: Qualified (Phase: Find)
  | "c1" | "c2"
  // Stage 3: Meeting booked (Phase: Meet)
  | "b1" | "b2" | "b3"
  // Stage 4: Requirements final (Phase: Meet)
  | "r1" | "r2" | "r3"
  // Stage 5: Proposal sent (Phase: Win)
  | "p1" | "p2" | "p3"
  // Stage 6: Signed and paid (Phase: Win)
  | "s1" | "s2" | "s3"
  // Stage 7: In progress (Phase: Build)
  | "w1" | "w2" | "w3"
  // Stage 8: Review (Phase: Build)
  | "v1" | "v2" | "v3"
  // Stage 9: Final payment (Phase: Handover)
  | "f1" | "f2"
  // Stage 10: Handed over (Phase: Handover)
  | "h1" | "h2" | "h3"
  // Legacy aliases for backward compatibility during migration
  | "m1" | "m2" | "m3" | "m4"
  | "d1" | "d2" | "d3"
  | "q1" | "q2";

export interface ChecklistItemDef {
  key: StageKey;
  label: string;
  who:
    | "Auto (form)"
    | "Auto"
    | "Auto (webhook)"
    | "Auto (Cal.com)"
    | "Auto (AI)"
    | "Founder"
    | "Founder (AI pre-fill)"
    | "Auto draft → founder taps Approve"
    | "Auto (client)"
    | "Auto (Razorpay)"
    | "Auto (portal uploads checklist)"
    | "Founder uploads → auto notifies client"
    | "Founder does work, auto tracks"
    | "Auto (client / timer)"
    | "Auto kit + founder confirms access transfer"
    | string;
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

export type ClientStatus = "active" | "cold" | "lost" | "completed" | "paused";

export interface Client {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  niche: string;
  package: string; // starter | growth | pro | creator | website_launch | business_website | ecommerce_store | app_mvp
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
  paused_follow_ups_until?: string;
  outbound_count?: number;
  last_inbound_at?: string;
  ai_confidence_score?: number;
  qualifying_answers?: {
    service_needed?: string;
    budget_range?: string;
    timeline?: string;
    calls_per_day?: string;
    after_hours?: string;
    current_cost?: string;
    preferred_time?: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export type ServiceType = "ai_agent" | "website" | "app" | "ecommerce" | "creator";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  service_type: ServiceType;
  package_id: string;
  price_paise: number;
  monthly_paise?: number;
  founding_offer: boolean;
  milestone_plan: "50_50" | "40_30_30";
  revision_rounds_included: number; // default 2
  revisions_used: number; // default 0
  portal_token: string;
  status: "active" | "paused" | "cold" | "lost" | "completed";
  next_step?: string;
  next_step_date?: string;
  checks: Record<string, ClientCheckRecord>;
  // Section 15 Zero-touch fields (Phases 10-12)
  is_self_serve?: boolean;
  self_serve_flagged?: boolean;
  self_serve_flag_reason?: string;
  self_serve_approved_by_founder?: boolean;
  declined_at?: string;
  template_id?: string;
  template_variant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RequirementRecord {
  id: string;
  project_id: string;
  features: string[];
  pages_screens: string[];
  pages_or_screens?: string[];
  integrations: string[];
  content_owner: string;
  deadline?: string;
  budget_paise: number;
  recorded_consent?: boolean;
  raw_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeRecord {
  id: string;
  project_id: string;
  version: number;
  goal: string;
  deliverables: string[];
  platforms: string[];
  languages: string[];
  limits: string[];
  not_included: string[];
  client_provides: string[];
  client_provides_deadline?: string;
  timeline_first_demo?: string;
  timeline_handover?: string;
  project_fee_paise: number;
  monthly_fee_paise: number;
  advance_paise: number;
  milestone_paise: number;
  final_paise: number;
  care_plan_paise: number;
  approved_by_founder: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgreementRecord {
  id: string;
  project_id: string;
  client_id: string;
  version: number;
  status: "draft" | "sent" | "accepted";
  pdf_url?: string;
  document_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface AgreementAcceptanceRecord {
  id: string;
  agreement_id: string;
  project_id: string;
  client_id?: string;
  typed_name?: string;
  signer_name?: string;
  signer_phone?: string;
  signer_ip?: string;
  accepted_at?: string;
  otp_code?: string;
  otp_verified?: boolean;
  otp_verified_at?: string;
  ip_address?: string;
  user_agent?: string;
  document_hash: string;
  created_at: string;
}

export interface TaskRecord {
  id: string;
  project_id: string;
  title: string;
  category: "build" | "revision" | "change_request" | "handover" | "review";
  hours_estimated: number;
  due_date?: string;
  done: boolean;
  done_at?: string;
  // Section 15 Freelancer delegation
  freelancer_id?: string;
  freelancer_payout_paise?: number;
  freelancer_status?: "assigned" | "submitted" | "approved";
  created_at: string;
  updated_at: string;
}

export interface TimeLogRecord {
  id: string;
  project_id: string;
  task_id?: string;
  description: string;
  hours: number;
  logged_date: string;
  hourly_rate_paise: number;
  hourly_rate_inr?: number;
  is_change_request: boolean;
  change_request_id?: string;
  created_at: string;
}

export interface DeliveryRecord {
  id: string;
  project_id: string;
  round_number: number;
  version?: number;
  type: "staging_link" | "test_number" | "demo_build" | "final_build";
  url_or_number: string;
  notes?: string;
  delivered_at: string;
  review_deadline: string; // 7 days from delivery
  deemed_accepted_at?: string;
}

export interface RevisionItemRecord {
  id: string;
  round_id: string;
  text: string;
  ai_label: "revision" | "new_feature";
  ai_reason: string;
  founder_confirmed: boolean;
  is_change_request: boolean;
  change_request_id?: string;
}

export interface RevisionRoundRecord {
  id: string;
  project_id: string;
  round_number: number;
  status: "open" | "submitted" | "in_progress" | "closed" | "deemed_accepted";
  submitted_at?: string;
  closed_at?: string;
  items: RevisionItemRecord[];
}

export interface ChangeRequestRecord {
  id: string;
  project_id: string;
  title: string;
  description: string;
  hours_quoted: number;
  amount_paise: number;
  status: "draft" | "quoted" | "approved" | "paid" | "completed";
  invoice_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HandoverRecord {
  id: string;
  project_id: string;
  invoice_paid: boolean;
  domain_transferred: boolean;
  source_code_transferred: boolean;
  repository_url?: string;
  credentials_link?: string;
  credentials_expiry?: string;
  agent_exported: boolean;
  documentation_url?: string;
  walkthrough_video_url?: string;
  warranty_start_date?: string;
  warranty_end_date?: string; // 30 days after handover
  care_plan_active: boolean;
  client_confirmed: boolean;
  client_confirmed_at?: string;
  completion_cert_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageCostRecord {
  id: string;
  service: "ai" | "voice" | "whatsapp" | "email" | "ai_tokens" | "voice_minutes" | "sms" | "hosting";
  model_or_channel: string;
  units: number;
  cost_paise: number;
  job_id?: string;
  project_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  project_id?: string;
  invoice_number: string;
  type: "advance" | "milestone" | "final" | "change" | "monthly" | "care";
  subtotal_paise: number;
  is_gst: boolean;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  gst_paise?: number;
  total_paise: number;
  status: "draft" | "sent" | "issued" | "paid" | "overdue";
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
  project_id?: string;
  version: number;
  package_id: string;
  setup_paise: number;
  monthly_paise: number;
  gst_paise?: number;
  total_first_bill_paise?: number;
  advance_paise?: number;
  scope_bullets?: string[];
  pdf_url?: string;
  status: "draft" | "sent" | "accepted" | "declined";
  accepted_at?: string;
  accepted_name?: string;
  auto_send_scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRecord {
  id: string;
  client_id: string;
  project_id?: string;
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
  project_id?: string;
  direction: "inbound" | "outbound";
  channel: "whatsapp" | "email";
  template?: string;
  body: string;
  status: "sent" | "delivered" | "received" | "failed";
  created_at: string;
}

export interface OutboxItem {
  id: string;
  channel: "whatsapp" | "email" | "otp" | "sms";
  recipient: string;
  template_name: string;
  subject?: string;
  content: string;
  full_text?: string;
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  status?: "sent" | "failed" | "queued" | "held_quiet_hours";
  error?: string;
  idempotency_key?: string;
  created_at: string;
}

export interface OtpRecord {
  id: string;
  project_id: string;
  client_id?: string;
  phone: string;
  otp: string;
  attempts: number;
  max_attempts: number;
  expires_at: number;
  used: boolean;
  created_at: string;
}

export interface DevSettings {
  force_failure: {
    whatsapp?: boolean;
    email?: boolean;
    razorpay?: boolean;
    cal?: boolean;
    ai?: boolean;
  };
  integrations: {
    whatsapp: "mock" | "live";
    email: "mock" | "live";
    razorpay: "mock" | "live";
    cal: "mock" | "live";
    ai: "mock" | "live";
  };
}

export interface AutomationRunRecord {
  id: string;
  automation_id: string;
  run_time: string;
  run_time_ist: string;
  trigger: "event" | "schedule" | "manual" | "webhook";
  project_id?: string;
  project_name: string;
  result: "success" | "failure" | "skipped";
  output_or_error: string;
  retries: string; // e.g. "0/3"
  created_at: string;
}

export interface JobRecord {
  id: string;
  idempotency_key?: string; // client_id/project_id + automation + step
  type: string;
  client_id?: string;
  project_id?: string;
  payload?: any;
  run_at: string;
  attempts: number;
  max_attempts: number;
  level: 1 | 2 | 3; // 1 = Auto, 2 = AI + approve, 3 = Human only
  shadow_mode: boolean;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogRecord {
  id: string;
  client_id?: string;
  project_id?: string;
  actor: "user" | "automation" | "client" | "system";
  action: string;
  detail: string;
  trigger_event?: string;
  ai_input?: string;
  ai_output?: string;
  confidence_score?: number;
  shadow?: boolean;
  created_at: string;
}

export interface AutomationSetting {
  id: string; // e.g. "A1", "A2", ...
  name: string;
  description: string;
  level: 1 | 2 | 3;
  enabled: boolean;
  shadow_mode: boolean;
  last_run?: string;
  success_count: number;
  failure_count: number;
  consecutive_no_edit_approvals: number;
  can_promote?: boolean;
}

export interface Recommendation {
  id: string;
  client_id?: string;
  project_id?: string;
  client_name?: string;
  type:
    | "forgotten_step"
    | "skipped_item"
    | "missing_data"
    | "money_at_risk"
    | "client_risk"
    | "upsell"
    | "coaching"
    | "learning_tip"
    | "scope_creep"
    | "spending_alert";
  title: string;
  reason: string;
  why_rule?: string;
  action_label: string;
  action_type: string;
  action_payload?: any;
  priority: "high" | "medium" | "low";
  money_at_risk_rupees?: number;
  status: "active" | "snoozed" | "dismissed" | "acted";
  snoozed_until?: string;
  created_at: string;
  acted_at?: string;
}

export interface Settings {
  agency_name: string;
  tagline: string;
  founder_name: string;
  founder_title: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  // GST Switch & details
  gst_registered: boolean;
  gstin: string;
  udyam_number: string;
  pan: string;
  sac_code: string;
  // Bank & UPI
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  upi_id: string;
  // Spending caps & rates
  ai_monthly_cap_inr: number;
  voice_monthly_cap_inr: number;
  hourly_change_rate_inr: number;
  pause_all_outbound: boolean;
  copilot_language: "hinglish" | "english";
  working_hours: string;
  quiet_hours: string;
  target_clients_month_3: number;
  target_mrr_month_6: number;
  package_prices?: Record<string, number>;
}

// ==========================================
// SECTION 15: ZERO-TOUCH UPGRADES DATA TYPES
// (Phases 10-12 forward-compatible schemas)
// ==========================================

export interface TemplateVariant {
  id: string;
  name: string;
  primary_color: string;
  layout_style: string;
  preview_thumbnail?: string;
}

export interface TemplateRecord {
  id: string;
  niche: "clinic" | "salon" | "restaurant" | "coaching" | "real_estate" | "gym" | "d2c" | "creator" | "other";
  type: "website" | "ai_agent" | "whatsapp_bot" | "app";
  title: string;
  description: string;
  version: number;
  variants: TemplateVariant[];
  created_at: string;
  updated_at: string;
}

export interface QualityCheckRecord {
  id: string;
  project_id: string;
  delivery_id?: string;
  lighthouse_performance: number;
  lighthouse_accessibility: number;
  lighthouse_best_practices: number;
  lighthouse_seo: number;
  broken_links_count: number;
  form_tested: boolean;
  agent_test_score?: number; // >= 90%
  passed: boolean;
  failure_reasons?: string[];
  founder_checked: boolean;
  checked_at?: string;
  created_at: string;
}

export interface ContentVersionRecord {
  id: string;
  project_id: string;
  version_number: number;
  title: string;
  author: "client" | "ai" | "founder";
  changes_summary: string;
  content_data: Record<string, any>;
  preview_url?: string;
  status: "draft_preview" | "approved_live" | "rolled_back";
  approved_by_client_at?: string;
  created_at: string;
}

export interface LedgerEntryRecord {
  id: string;
  project_id?: string;
  type: "revenue" | "expense" | "refund" | "commission";
  category:
    | "client_milestone"
    | "monthly_retainer"
    | "ai_tokens"
    | "voice_minutes"
    | "hosting"
    | "whatsapp_api"
    | "freelancer_payout"
    | "partner_commission"
    | "other";
  amount_paise: number;
  is_gst: boolean;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  tds_paise?: number;
  reference_id?: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
}

export interface FreelancerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  portal_token: string;
  nda_accepted: boolean;
  nda_accepted_at?: string;
  status: "active" | "paused" | "inactive";
  created_at: string;
  updated_at: string;
}
