import { loadState, saveState } from "./storage";
import {
  Client,
  Project,
  RequirementRecord,
  ScopeRecord,
  AgreementRecord,
  AgreementAcceptanceRecord,
  TaskRecord,
  TimeLogRecord,
  DeliveryRecord,
  RevisionRoundRecord,
  RevisionItemRecord,
  ChangeRequestRecord,
  HandoverRecord,
  UsageCostRecord,
  Invoice,
  Proposal,
  MessageRecord,
  AgentRecord,
  JobRecord,
  ActivityLogRecord,
  AutomationSetting,
  Recommendation,
  Settings,
  StageKey,
  TemplateRecord,
  QualityCheckRecord,
  ContentVersionRecord,
  LedgerEntryRecord,
  FreelancerRecord,
  OutboxItem,
  DevSettings,
  AutomationRunRecord,
  OtpRecord,
} from "./types";
import { calculateBill, rupeesToPaise, getPackageWithSettings, formatINR } from "./pricing";
import { DEMO_NUMBER, WHATSAPP_NUMBER, EMAIL, CITY, FOUNDER_NAME, SITE_CONFIG } from "@/content/site";
import { getAppDate, getAppTimeISO, getAppTimeIST } from "./clock";


interface DatabaseSchema {
  clients: Client[];
  projects: Project[];
  requirements: RequirementRecord[];
  scopes: ScopeRecord[];
  agreements: AgreementRecord[];
  agreement_acceptances: AgreementAcceptanceRecord[];
  tasks: TaskRecord[];
  time_logs: TimeLogRecord[];
  deliveries: DeliveryRecord[];
  revision_rounds: RevisionRoundRecord[];
  change_requests: ChangeRequestRecord[];
  handovers: HandoverRecord[];
  usage_costs: UsageCostRecord[];
  invoices: Invoice[];
  proposals: Proposal[];
  messages: MessageRecord[];
  agents: AgentRecord[];
  jobs: JobRecord[];
  activity_log: ActivityLogRecord[];
  automations: AutomationSetting[];
  recommendations: Recommendation[];
  settings: Settings;
  // Section 15 Zero-touch collections (Phases 10-12)
  templates_library?: TemplateRecord[];
  quality_checks?: QualityCheckRecord[];
  content_versions?: ContentVersionRecord[];
  ledger?: LedgerEntryRecord[];
  freelancers?: FreelancerRecord[];
  // QA Dev Toolbar Outbox & Settings
  outbox?: OutboxItem[];
  dev_settings?: DevSettings;
  automation_runs?: AutomationRunRecord[];
  otps?: OtpRecord[];
  queued_messages?: OutboxItem[];
  idempotency_keys?: string[];
}

// Initial Seed Data for v2 (One AI agent, one website, one app at different stages)
function getInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // Client 1: Sunrise Dental Clinic (AI Voice & WhatsApp Receptionist)
  const client1: Client = {
    id: "c-ex-1",
    name: "Example — Sunrise Dental Clinic",
    owner_name: "Dr. Vikram Mehta",
    phone: "+91 98200 45678",
    email: "vikram@sunrisedental.in",
    city: "Mumbai",
    state: "Maharashtra",
    niche: "Dental clinic",
    package: "growth",
    founding_offer: false,
    notes: "Owner requested 30-sec demo call on Friday. Needs Google Calendar booking.",
    next_step: "Call demo agent with doctor live on Friday",
    next_step_date: tomorrow,
    status: "active",
    portal_token: "tok_sunrise_dent_782",
    consent_at: yesterday,
    source: "website_demo_form",
    is_example: true,
    outbound_count: 1,
    qualifying_answers: {
      service_needed: "AI agent",
      budget_range: "₹35,000 setup + ₹19,999/mo",
      timeline: "Within 1 week",
      calls_per_day: "35 calls/day",
      after_hours: "12 calls after 8 PM",
      current_cost: "₹16,000/month front desk",
      preferred_time: "Evenings after 6 PM",
      description: "Needs 24/7 Hindi and English call answering and WhatsApp appointment scheduler.",
    },
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  // Client 2: Dr. Batra Skin & Hair (Custom Business Website)
  const client2: Client = {
    id: "c-ex-2",
    name: "Example — Dr. Batra Skin & Hair Care",
    owner_name: "Dr. Rohini Batra",
    phone: "+91 99301 88221",
    email: "dr.rohini@batraskin.com",
    city: "Bengaluru",
    state: "Karnataka",
    niche: "Skin & hair clinic",
    package: "business_website",
    founding_offer: false,
    notes: "Proposal and Annex A sent to client portal. Waiting for client agreement OTP signature.",
    next_step: "Follow up with Dr. Batra on proposal review",
    next_step_date: nextWeek,
    status: "active",
    portal_token: "tok_batra_skin_419",
    consent_at: yesterday,
    source: "referral",
    is_example: true,
    outbound_count: 2,
    qualifying_answers: {
      service_needed: "Website",
      budget_range: "₹59,999 (Founding 50% applied: ₹29,999)",
      timeline: "2 weeks",
      calls_per_day: "65 calls/day (2 doctors)",
      after_hours: "22 calls after hours & Sunday",
      current_cost: "₹28,000/month (2 receptionists)",
      preferred_time: "Morning 11 AM",
      description: "Up to 15 pages with CMS, treatment bookings, doctor bios, and integrated AI chat.",
    },
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
      l2: { key: "l2", done: true, done_at: yesterday, done_by: "automation" },
      l3: { key: "l3", done: true, done_at: yesterday, done_by: "automation" },
      c1: { key: "c1", done: true, done_at: yesterday, done_by: "automation" },
      c2: { key: "c2", done: true, done_at: yesterday, done_by: "automation" },
      b1: { key: "b1", done: true, done_at: yesterday, done_by: "automation" },
      b2: { key: "b2", done: true, done_at: yesterday, done_by: "automation" },
      b3: { key: "b3", done: true, done_at: yesterday, done_by: "automation" },
      r1: { key: "r1", done: true, done_at: yesterday, done_by: "user" },
      r2: { key: "r2", done: true, done_at: yesterday, done_by: "user" },
      r3: { key: "r3", done: true, done_at: yesterday, done_by: "user" },
      p1: { key: "p1", done: true, done_at: yesterday, done_by: "automation" },
      p2: { key: "p2", done: true, done_at: yesterday, done_by: "automation" },
      p3: { key: "p3", done: true, done_at: yesterday, done_by: "automation" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  // Client 3: Nova Diagnostics (Cross-Platform Mobile App MVP)
  const client3: Client = {
    id: "c-ex-3",
    name: "Example — Nova Diagnostics & Imaging",
    owner_name: "Amitabh Sen",
    phone: "+91 97110 33412",
    email: "operations@novadiagnostics.in",
    city: "Delhi NCR",
    state: "Delhi",
    niche: "Diagnostic lab",
    package: "app_mvp",
    founding_offer: false,
    notes: "App MVP live on stores. Active on App Care Plan (₹4,999/mo).",
    next_step: "Monthly care plan update & review",
    next_step_date: nextWeek,
    status: "completed",
    portal_token: "tok_nova_diag_305",
    consent_at: yesterday,
    source: "referral",
    is_example: true,
    outbound_count: 5,
    qualifying_answers: {
      service_needed: "App",
      budget_range: "₹2,99,999",
      timeline: "6 weeks",
      calls_per_day: "120 calls/day",
      after_hours: "40 calls for report status",
      current_cost: "₹35,000/month front desk",
      preferred_time: "Afternoons",
      description: "Patient booking & automated test report download app for Android & iOS.",
    },
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
      l2: { key: "l2", done: true, done_at: yesterday, done_by: "automation" },
      l3: { key: "l3", done: true, done_at: yesterday, done_by: "automation" },
      c1: { key: "c1", done: true, done_at: yesterday, done_by: "automation" },
      c2: { key: "c2", done: true, done_at: yesterday, done_by: "automation" },
      b1: { key: "b1", done: true, done_at: yesterday, done_by: "automation" },
      b2: { key: "b2", done: true, done_at: yesterday, done_by: "automation" },
      b3: { key: "b3", done: true, done_at: yesterday, done_by: "automation" },
      r1: { key: "r1", done: true, done_at: yesterday, done_by: "user" },
      r2: { key: "r2", done: true, done_at: yesterday, done_by: "user" },
      r3: { key: "r3", done: true, done_at: yesterday, done_by: "user" },
      p1: { key: "p1", done: true, done_at: yesterday, done_by: "automation" },
      p2: { key: "p2", done: true, done_at: yesterday, done_by: "automation" },
      p3: { key: "p3", done: true, done_at: yesterday, done_by: "automation" },
      s1: { key: "s1", done: true, done_at: yesterday, done_by: "client" },
      s2: { key: "s2", done: true, done_at: yesterday, done_by: "automation" },
      s3: { key: "s3", done: true, done_at: yesterday, done_by: "client" },
      w1: { key: "w1", done: true, done_at: yesterday, done_by: "automation" },
      w2: { key: "w2", done: true, done_at: yesterday, done_by: "user" },
      w3: { key: "w3", done: true, done_at: yesterday, done_by: "user" },
      v1: { key: "v1", done: true, done_at: yesterday, done_by: "user" },
      v2: { key: "v2", done: true, done_at: yesterday, done_by: "user" },
      v3: { key: "v3", done: true, done_at: yesterday, done_by: "client" },
      f1: { key: "f1", done: true, done_at: yesterday, done_by: "automation" },
      f2: { key: "f2", done: true, done_at: yesterday, done_by: "automation" },
      h1: { key: "h1", done: true, done_at: yesterday, done_by: "user" },
      h2: { key: "h2", done: true, done_at: yesterday, done_by: "client" },
      h3: { key: "h3", done: true, done_at: yesterday, done_by: "automation" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  // 3 Projects mapping 1:1 to the 3 verticals in v2
  const projects: Project[] = [
    {
      id: "proj-1",
      client_id: "c-ex-1",
      name: "Example — Sunrise Dental AI Receptionist",
      service_type: "ai_agent",
      package_id: "growth",
      price_paise: 3500000,
      monthly_paise: 1999900,
      founding_offer: false,
      milestone_plan: "50_50",
      revision_rounds_included: 2,
      revisions_used: 0,
      portal_token: "tok_sunrise_dent_782",
      status: "active",
      next_step: "Call demo agent with doctor live on Friday",
      next_step_date: tomorrow,
      checks: client1.checks,
      created_at: yesterday,
      updated_at: now,
    },
    {
      id: "proj-2",
      client_id: "c-ex-2",
      name: "Example — Dr. Batra Skin & Hair Website",
      service_type: "website",
      package_id: "business_website",
      price_paise: 5999900, // ₹59,999
      monthly_paise: 199900, // Care plan
      founding_offer: false,
      milestone_plan: "50_50",
      revision_rounds_included: 2,
      revisions_used: 0,
      portal_token: "tok_batra_skin_419",
      status: "active",
      next_step: "Follow up with Dr. Batra on proposal review",
      next_step_date: nextWeek,
      checks: client2.checks,
      created_at: yesterday,
      updated_at: now,
    },
    {
      id: "proj-3",
      client_id: "c-ex-3",
      name: "Example — Nova Diagnostics Mobile App MVP",
      service_type: "app",
      package_id: "app_mvp",
      price_paise: 29999900,
      monthly_paise: 499900, // App care plan
      founding_offer: false,
      milestone_plan: "40_30_30",
      revision_rounds_included: 2,
      revisions_used: 2,
      portal_token: "tok_nova_diag_305",
      status: "completed",
      next_step: "Monthly care plan update & review",
      next_step_date: nextWeek,
      checks: client3.checks,
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const requirements: RequirementRecord[] = [
    {
      id: "req-2",
      project_id: "proj-2",
      features: [
        "15 responsive pages (Home, Treatments, Doctors, Pricing, Gallery, Contact)",
        "Integrated WhatsApp conversational widget",
        "Direct Google Calendar consult booking",
        "Custom blog for doctor SEO articles",
      ],
      pages_screens: ["Home", "About", "Treatments (10 subpages)", "Doctors", "Blog", "Contact"],
      integrations: ["Google Calendar", "Razorpay", "WhatsApp Cloud API"],
      content_owner: "Dr. Rohini Batra",
      deadline: nextWeek,
      budget_paise: 2999950,
      recorded_consent: true,
      raw_notes: "Focus on clean aesthetic, Before/After photo slider, and easy consult booking.",
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const scopes: ScopeRecord[] = [
    {
      id: "scope-2",
      project_id: "proj-2",
      version: 1,
      goal: "Modern high-converting 15-page website with CMS and WhatsApp booking",
      deliverables: [
        "15 responsive custom-designed pages",
        "Next.js + Tailwind modern frontend",
        "Headless CMS for doctor blog posts & photos",
        "Integrated AI appointment booking chat widget",
      ],
      platforms: ["Web (Desktop & Mobile)"],
      languages: ["English", "Hindi"],
      limits: ["Up to 15 pages", "2 revision rounds included"],
      not_included: ["Custom mobile app", "Copywriting beyond approved bullet points"],
      client_provides: ["Doctor high-res photos", "Clinic pricing sheet", "Domain DNS access"],
      timeline_first_demo: yesterday,
      timeline_handover: nextWeek,
      project_fee_paise: 2999950,
      monthly_fee_paise: 199900,
      advance_paise: 1500000,
      milestone_paise: 0,
      final_paise: 1499950,
      care_plan_paise: 199900,
      approved_by_founder: true,
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const agreements: AgreementRecord[] = [
    {
      id: "agr-2",
      project_id: "proj-2",
      client_id: "c-ex-2",
      version: 1,
      status: "sent",
      pdf_url: "/api/agreements/agr-2/pdf",
      document_hash: "a4f89921bc3847e1d5209341",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "agr-3",
      project_id: "proj-3",
      client_id: "c-ex-3",
      version: 1,
      status: "accepted",
      pdf_url: "/api/agreements/agr-3/pdf",
      document_hash: "b9c71283ea442010c7104882",
      created_at: yesterday,
      updated_at: yesterday,
    },
  ];

  const agreement_acceptances: AgreementAcceptanceRecord[] = [
    {
      id: "acc-3",
      agreement_id: "agr-3",
      project_id: "proj-3",
      typed_name: "Amitabh Sen",
      otp_code: "610294",
      otp_verified: true,
      otp_verified_at: yesterday,
      ip_address: "103.21.124.55",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      document_hash: "b9c71283ea442010c7104882",
      created_at: yesterday,
    },
  ];

  const tasks: TaskRecord[] = [
    {
      id: "task-1",
      project_id: "proj-2",
      title: "Integrate Before/After photo slider on Treatments page",
      category: "revision",
      hours_estimated: 2,
      due_date: tomorrow,
      done: false,
      created_at: yesterday,
      updated_at: now,
    },
    {
      id: "task-2",
      project_id: "proj-2",
      title: "Connect Razorpay consultation checkout form",
      category: "build",
      hours_estimated: 3,
      due_date: yesterday,
      done: true,
      done_at: yesterday,
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "task-3",
      project_id: "proj-1",
      title: "Clone demo voice receptionist and customize clinic prompt",
      category: "build",
      hours_estimated: 1.5,
      due_date: tomorrow,
      done: true,
      done_at: yesterday,
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const time_logs: TimeLogRecord[] = [
    {
      id: "time-1",
      project_id: "proj-2",
      task_id: "task-2",
      description: "Built custom Razorpay modal and webhook listener",
      hours: 2.5,
      logged_date: yesterday.slice(0, 10),
      hourly_rate_paise: 100000,
      is_change_request: false,
      created_at: yesterday,
    },
  ];

  const deliveries: DeliveryRecord[] = [
    {
      id: "del-2-1",
      project_id: "proj-2",
      round_number: 1,
      type: "staging_link",
      url_or_number: "https://staging.batraskin.agentwala.in",
      notes: "First working demo of all 15 pages and WhatsApp appointment booking widget.",
      delivered_at: yesterday,
      review_deadline: nextWeek,
    },
  ];

  const revision_rounds: RevisionRoundRecord[] = [
    {
      id: "rev-2-1",
      project_id: "proj-2",
      round_number: 1,
      status: "in_progress",
      submitted_at: yesterday,
      items: [
        {
          id: "item-1",
          round_id: "rev-2-1",
          text: "Can we swap the consultation button color to deep emerald and adjust the clinic hours to 10 AM–8 PM?",
          ai_label: "revision",
          ai_reason: "In-scope change to text and button styling of existing pages.",
          founder_confirmed: true,
          is_change_request: false,
        },
        {
          id: "item-2",
          round_id: "rev-2-1",
          text: "Also add an online pharmacy medicine ordering cart with delivery tracking.",
          ai_label: "new_feature",
          ai_reason: "Outside Annex A scope (15 content pages). Requires full e-commerce & cart backend.",
          founder_confirmed: true,
          is_change_request: true,
          change_request_id: "cr-2-1",
        },
      ],
    },
  ];

  const change_requests: ChangeRequestRecord[] = [
    {
      id: "cr-2-1",
      project_id: "proj-2",
      title: "Online Pharmacy Medicine Store Module",
      description: "Product inventory, prescription upload flow, and order status notifications.",
      hours_quoted: 15,
      amount_paise: 1500000, // 15 hours * ₹1,000/hr = ₹15,000
      status: "quoted",
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const handovers: HandoverRecord[] = [
    {
      id: "hand-3",
      project_id: "proj-3",
      invoice_paid: true,
      domain_transferred: true,
      source_code_transferred: true,
      repository_url: "https://github.com/nova-diagnostics/mobile-app-mvp",
      credentials_link: "https://agentwala.in/vault/one-time-tok-847291",
      credentials_expiry: yesterday,
      agent_exported: true,
      documentation_url: "https://novadiagnostics.in/docs/app-guide.pdf",
      walkthrough_video_url: "https://loom.com/share/nova-app-walkthrough",
      warranty_start_date: yesterday.slice(0, 10),
      warranty_end_date: new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10),
      care_plan_active: true,
      client_confirmed: true,
      client_confirmed_at: yesterday,
      completion_cert_url: "/api/handovers/hand-3/certificate",
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const usage_costs: UsageCostRecord[] = [
    {
      id: "cost-1",
      service: "ai",
      model_or_channel: "gemini-2.5-flash",
      units: 4200,
      cost_paise: 84, // ₹0.84
      project_id: "proj-2",
      created_at: yesterday,
    },
    {
      id: "cost-2",
      service: "voice",
      model_or_channel: "telephony-line",
      units: 120, // seconds
      cost_paise: 1600, // ₹16.00
      project_id: "proj-1",
      created_at: yesterday,
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv-2-adv",
      client_id: "c-ex-2",
      project_id: "proj-2",
      invoice_number: "AW/2026-27/0001",
      type: "advance",
      subtotal_paise: 3000000, // ₹30,000 (advance on ₹59,999)
      is_gst: false, // GST unregistered by default
      cgst_paise: 0,
      sgst_paise: 0,
      igst_paise: 0,
      total_paise: 3000000,
      status: "sent", // Dr. Batra: Proposal sent, waiting for advance
      due_date: tomorrow,
      razorpay_payment_url: "https://rzp.io/i/mock_batra_adv_441",
      pdf_url: "/api/invoices/inv-2-adv/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-adv",
      client_id: "c-ex-3",
      project_id: "proj-3",
      invoice_number: "AW/2026-27/0002",
      type: "advance",
      subtotal_paise: 12000000, // ₹1,20,000 (40% of ₹2,99,999)
      is_gst: false,
      cgst_paise: 0,
      sgst_paise: 0,
      igst_paise: 0,
      total_paise: 12000000,
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_nova_adv",
      pdf_url: "/api/invoices/inv-3-adv/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-mid",
      client_id: "c-ex-3",
      project_id: "proj-3",
      invoice_number: "AW/2026-27/0003",
      type: "milestone",
      subtotal_paise: 9000000, // ₹90,000 (30% of ₹2,99,999)
      is_gst: false,
      cgst_paise: 0,
      sgst_paise: 0,
      igst_paise: 0,
      total_paise: 9000000,
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_nova_mid",
      pdf_url: "/api/invoices/inv-3-mid/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-fin",
      client_id: "c-ex-3",
      project_id: "proj-3",
      invoice_number: "AW/2026-27/0004",
      type: "final",
      subtotal_paise: 8999900, // ₹89,999 (last milestone: ₹2,99,999 - ₹1,20,000 - ₹90,000)
      is_gst: false,
      cgst_paise: 0,
      sgst_paise: 0,
      igst_paise: 0,
      total_paise: 8999900,
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_nova_fin",
      pdf_url: "/api/invoices/inv-3-fin/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-care",
      client_id: "c-ex-3",
      project_id: "proj-3",
      invoice_number: "AW/2026-27/0005",
      type: "monthly",
      subtotal_paise: 499900, // Monthly care plan ₹4,999
      is_gst: false,
      cgst_paise: 0,
      sgst_paise: 0,
      igst_paise: 0,
      total_paise: 499900,
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_nova_care",
      pdf_url: "/api/invoices/inv-3-care/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
  ];

  const proposals: Proposal[] = [];

  // Official v2 Automations A1–A20 with levels
  const automations: AutomationSetting[] = [
    { id: "A1", name: "Project enquiry captured", description: "Creates client + project, ticks l1–l3, notifies founder on WhatsApp", level: 1, enabled: true, shadow_mode: false, success_count: 14, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A2", name: "Welcome message with booking link", description: "WhatsApp + email with booking link within 2 min → ticks c1", level: 1, enabled: true, shadow_mode: false, success_count: 14, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A3", name: "Reply detection & pause nudges", description: "Inbound message or booking ticks c2 and pauses nudges for 48h", level: 1, enabled: true, shadow_mode: false, success_count: 11, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A4", name: "Lead nurture", description: "Follow-ups at 24h & 72h; marks cold if 3 messages unresponded", level: 1, enabled: true, shadow_mode: false, success_count: 9, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A5", name: "Booking webhook & calendar sync", description: "Cal.com webhook ticks b1, schedules Meet URL, sets next step date", level: 1, enabled: true, shadow_mode: false, success_count: 7, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A6", name: "Pre-meeting AI brief", description: "Public info research, 10 questions for service type, suggested package & price → ticks b2", level: 1, enabled: true, shadow_mode: false, success_count: 7, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A7", name: "Meeting reminders", description: "WhatsApp reminders 24h and 1h before meeting → ticks b3", level: 1, enabled: true, shadow_mode: false, success_count: 6, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A8", name: "Scope & agreement dispatch", description: "After founder approves scope: sends agreement + quote to portal → ticks p2; follows up at 48h → p3", level: 1, enabled: true, shadow_mode: false, success_count: 5, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A9", name: "Agreement accepted & advance invoice", description: "Portal accept ticks s1 → creates Razorpay link → on payment ticks s2 → generates invoice", level: 1, enabled: true, shadow_mode: false, success_count: 4, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A10", name: "Kickoff content & assets checklist", description: "Sends onboarding upload checklist, nudges every 3 days → ticks s3 when complete", level: 1, enabled: true, shadow_mode: false, success_count: 4, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A11", name: "Work plan generator", description: "AI generates tasks and milestones from scope deliverables with due dates → ticks w1", level: 1, enabled: true, shadow_mode: false, success_count: 4, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A12", name: "Weekly client update", description: "Friday 5 PM AI writes short progress note from ticked tasks & hours, shadow mode until approved", level: 2, enabled: true, shadow_mode: true, success_count: 3, failure_count: 0, consecutive_no_edit_approvals: 10 },
    { id: "A13", name: "Delivery shared & review timer", description: "Founder uploads link/demo → auto notifies client, starts 7-day review timer → ticks w3", level: 1, enabled: true, shadow_mode: false, success_count: 3, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A14", name: "Revision engine & deemed acceptance", description: "Tracks round 1 & 2 submissions; deemed accepted on day 7 if silent → ticks v1–v3", level: 1, enabled: true, shadow_mode: false, success_count: 2, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A15", name: "Milestone and final invoices", description: "Dispatches final invoice on review complete → ticks f1; payment webhook → ticks f2", level: 1, enabled: true, shadow_mode: false, success_count: 2, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A16", name: "Handover kit generator", description: "Builds Annex B kit, completion cert, one-time credentials link → ticks h1 draft; client confirms → ticks h2", level: 1, enabled: true, shadow_mode: false, success_count: 2, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A17", name: "Warranty, care plan & review request", description: "Starts 30-day warranty, monthly care plan subscription, and requests Google review 3 days later → ticks h3", level: 1, enabled: true, shadow_mode: false, success_count: 2, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A18", name: "Warranty expiry care plan offer", description: "7 days before warranty ends, sends automated care plan proposal", level: 1, enabled: true, shadow_mode: false, success_count: 1, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A19", name: "Monthly billing & dunning", description: "Retainer & care plan invoices with reminders at +3, +7 and +14 days", level: 1, enabled: true, shadow_mode: false, success_count: 1, failure_count: 0, consecutive_no_edit_approvals: 15 },
    { id: "A20", name: "Founder daily 9:00 AM digest", description: "WhatsApp summary of today's meetings, top 3 Copilot actions, money in/out, failures", level: 1, enabled: true, shadow_mode: false, success_count: 14, failure_count: 0, consecutive_no_edit_approvals: 15 },
  ];

  const activity_log: ActivityLogRecord[] = [
    { id: "log-1", client_id: "c-ex-3", project_id: "proj-3", actor: "automation", action: "Final payment received", detail: "Razorpay paid final invoice AW/2026-27/0002. Ticked f2.", trigger_event: "razorpay_webhook", confidence_score: 1.0, shadow: false, created_at: yesterday },
    { id: "log-2", client_id: "c-ex-2", project_id: "proj-2", actor: "client", action: "Agreement accepted via OTP", detail: "Dr. Rohini Batra verified OTP 849201 and accepted Master Service Agreement v1. Ticked s1.", trigger_event: "portal_otp", confidence_score: 1.0, shadow: false, created_at: yesterday },
    { id: "log-3", client_id: "c-ex-2", project_id: "proj-2", actor: "automation", action: "Advance invoice paid", detail: "Advance ₹15,000 received. Ticked s2.", trigger_event: "razorpay_webhook", confidence_score: 1.0, shadow: false, created_at: yesterday },
    { id: "log-4", client_id: "c-ex-1", project_id: "proj-1", actor: "automation", action: "Project enquiry registered", detail: "Website enquiry form captured for Sunrise Dental Clinic. Ticked l1–l3.", trigger_event: "website_enquiry_form", confidence_score: 1.0, shadow: false, created_at: yesterday },
  ];

  const recommendations: Recommendation[] = [
    {
      id: "rec-1",
      client_id: "c-ex-2",
      project_id: "proj-2",
      client_name: "Dr. Batra Skin & Hair Care",
      type: "scope_creep",
      title: "New feature detected in Revision Round 1: Pharmacy Store",
      reason: "Client requested an online pharmacy medicine store with delivery tracking. AI labeled this as a New Feature (outside Annex A). Confirm change request quote.",
      why_rule: "Revision Engine: item classified as 'new_feature' requires founder approval before billing.",
      action_label: "Review Change Request",
      action_type: "navigate",
      action_payload: { url: "/admin/clients/c-ex-2" },
      priority: "high",
      money_at_risk_rupees: 15000,
      status: "active",
      created_at: now,
    },
    {
      id: "rec-2",
      client_id: "c-ex-1",
      project_id: "proj-1",
      client_name: "Sunrise Dental Clinic",
      type: "money_at_risk",
      title: "Friday demo walkthrough scheduled",
      reason: "Dr. Vikram Mehta wants a live phone call demo. Pre-meeting brief ready (A6).",
      why_rule: "Lead in Qualified stage with scheduled meeting date.",
      action_label: "Open Client Detail",
      action_type: "navigate",
      action_payload: { url: "/admin/clients/c-ex-1" },
      priority: "high",
      money_at_risk_rupees: 35000,
      status: "active",
      created_at: now,
    },
  ];

  return {
    clients: [client1, client2, client3],
    projects,
    requirements,
    scopes,
    agreements,
    agreement_acceptances,
    tasks,
    time_logs,
    deliveries,
    revision_rounds,
    change_requests,
    handovers,
    usage_costs,
    invoices,
    proposals,
    messages: [
      { id: "msg-1", client_id: "c-ex-1", project_id: "proj-1", direction: "outbound", channel: "whatsapp", body: `Hello Dr. Vikram! Welcome to AgentWala. Test our demo receptionist at ${DEMO_NUMBER} or pick a 20-min slot.`, status: "delivered", created_at: yesterday },
    ],
    agents: [
      {
        id: "ag-1",
        client_id: "c-ex-1",
        project_id: "proj-1",
        niche: "Dental clinic",
        prompt: "You are the AI Receptionist for Sunrise Dental Clinic. Answer politely in Hindi and English.",
        knowledge_base: "Timings: Mon-Sat 10 AM - 8 PM. Doctor consultation: ₹800. Indiranagar.",
        status: "testing",
        created_at: yesterday,
        updated_at: now,
      },
    ],
    jobs: [],
    activity_log,
    automations,
    recommendations,
    settings: {
      agency_name: "AgentWala",
      tagline: "AI Agents, WhatsApp Bots, Websites & Apps",
      founder_name: FOUNDER_NAME || "Akash Verma",
      founder_title: "Founder & Lead Engineer",
      phone: WHATSAPP_NUMBER || "+91 98200 12345",
      email: EMAIL || "hello@agentwala.in",
      city: CITY || "Bengaluru",
      state: "Karnataka",
      address: "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
      gst_registered: false,
      gstin: "",
      udyam_number: "UDYAM-KR-03-0012345",
      pan: "ABCDE1234F",
      sac_code: "998313",
      bank_name: "HDFC Bank",
      account_name: "AgentWala Solutions",
      account_number: "50200012345678",
      ifsc: "HDFC0001234",
      upi_id: "agentwala@okhdfcbank",
      ai_monthly_cap_inr: 5000,
      voice_monthly_cap_inr: 3000,
      hourly_change_rate_inr: 1000,
      pause_all_outbound: false,
      copilot_language: "hinglish",
      working_hours: "10 AM - 7 PM IST",
      quiet_hours: "9 PM - 9 AM IST",
      target_clients_month_3: 5,
      target_mrr_month_6: 200000,
    },
  };
}

// In-Memory Cache with Short TTL (2 seconds)
let memoryCache: DatabaseSchema | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 2000;

async function ensureDataFile(): Promise<DatabaseSchema> {
  const now = Date.now();
  if (memoryCache && now - lastCacheTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  let parsed: DatabaseSchema | null = null;
  try {
    parsed = await loadState<DatabaseSchema>("db");
  } catch (e) {
    console.error("[db] Error loading state from storage:", e);
  }

  let changed = false;
  const seed = getInitialSeed();

  if (!parsed) {
    parsed = seed;
    changed = true;
  } else {
    // Ensure all v2 collections exist
    const collections = [
      "projects", "requirements", "scopes", "agreements", "agreement_acceptances",
      "tasks", "time_logs", "deliveries", "revision_rounds", "change_requests",
      "handovers", "usage_costs", "recommendations", "automations", "invoices", "clients"
    ] as const;

    for (const col of collections) {
      if (!parsed[col] || parsed[col].length === 0) {
        parsed[col] = (seed as any)[col] || [];
        changed = true;
      }
    }

    // Ensure v2 settings fields exist
    if (!parsed.settings) {
      parsed.settings = seed.settings;
      changed = true;
    } else {
      if (parsed.settings.gst_registered === undefined) {
        parsed.settings.gst_registered = false;
        changed = true;
      }
      if (!parsed.settings.ai_monthly_cap_inr) {
        parsed.settings.ai_monthly_cap_inr = 5000;
        changed = true;
      }
      if (!parsed.settings.voice_monthly_cap_inr) {
        parsed.settings.voice_monthly_cap_inr = 3000;
        changed = true;
      }
      if (!parsed.settings.hourly_change_rate_inr) {
        parsed.settings.hourly_change_rate_inr = 1000;
        changed = true;
      }
      if (!parsed.settings.state) {
        parsed.settings.state = "Karnataka";
        changed = true;
      }
      if (!parsed.settings.udyam_number) {
        parsed.settings.udyam_number = "UDYAM-KR-03-0012345";
        changed = true;
      }
    }

    // Ensure projects exist and map to clients
    if (!parsed.projects || parsed.projects.length === 0) {
      parsed.projects = seed.projects;
      changed = true;
    }

    // Initialize forward-compatible Section 15 stores (Zero-touch upgrades)
    if (!parsed.templates_library) { parsed.templates_library = []; changed = true; }
    if (!parsed.quality_checks) { parsed.quality_checks = []; changed = true; }
    if (!parsed.content_versions) { parsed.content_versions = []; changed = true; }
    if (!parsed.ledger) { parsed.ledger = []; changed = true; }
    if (!parsed.freelancers) { parsed.freelancers = []; changed = true; }
    if (!parsed.otps) { parsed.otps = []; changed = true; }
    if (!parsed.queued_messages) { parsed.queued_messages = []; changed = true; }
    if (!parsed.idempotency_keys) { parsed.idempotency_keys = []; changed = true; }
  }

  memoryCache = parsed;
  lastCacheTime = Date.now();
  if (changed) {
    await writeData(parsed);
  }
  return parsed;
}

async function writeData(data: DatabaseSchema): Promise<void> {
  memoryCache = data;
  lastCacheTime = Date.now();
  await saveState("db", data);
}

export const db = {
  // CLIENTS
  async getClients(): Promise<Client[]> {
    const data = await ensureDataFile();
    return data.clients;
  },

  async getClientById(id: string): Promise<Client | null> {
    const data = await ensureDataFile();
    return data.clients.find((c) => c.id === id) || null;
  },

  async getClientByToken(token: string): Promise<Client | null> {
    const data = await ensureDataFile();
    return data.clients.find((c) => c.portal_token === token) || null;
  },

  async getClientDetailBundle(targetId: string) {
    const data = await ensureDataFile();
    const client = data.clients.find(
      (c) => c.id === targetId || (data.projects || []).some((p) => p.id === targetId && p.client_id === c.id)
    );
    if (!client) return null;

    const clientId = client.id;
    const projects = (data.projects || []).filter((p) => p.client_id === clientId);
    const activeProject = projects.find((p) => p.id === targetId) || projects[0] || null;
    const projectId = activeProject?.id || clientId;

    // Fix #12: Keep checks unified in project.checks
    if (activeProject && activeProject.checks) {
      client.checks = { ...activeProject.checks };
    }

    const invoices = (data.invoices || []).filter((i) => i.client_id === clientId || i.project_id === projectId);
    const proposal = (data.proposals || []).find((pr) => pr.client_id === clientId || pr.project_id === projectId) || null;
    const messages = (data.messages || []).filter((m) => m.client_id === clientId || m.project_id === projectId);
    const logs = (data.activity_log || []).filter((l) => l.client_id === clientId || l.project_id === projectId).slice(0, 50);
    const agent = (data.agents || []).find((a) => a.client_id === clientId || a.project_id === projectId) || null;
    const recommendations = (data.recommendations || []).filter(
      (r) => r.status === "active" && (r.client_id === clientId || r.project_id === projectId)
    );

    const requirements = (data.requirements || []).find((r) => r.project_id === projectId) || null;
    const scopes = (data.scopes || []).filter((s) => s.project_id === projectId);
    const agreements = (data.agreements || []).filter((a) => a.project_id === projectId);
    const tasks = (data.tasks || []).filter((t) => t.project_id === projectId);
    const timeLogs = (data.time_logs || []).filter((tl) => tl.project_id === projectId);
    const deliveries = (data.deliveries || []).filter((d) => d.project_id === projectId);
    const revisions = (data.revision_rounds || []).filter((rr) => rr.project_id === projectId);
    const changeRequests = (data.change_requests || []).filter((cr) => cr.project_id === projectId);
    const handover = (data.handovers || []).find((h) => h.project_id === projectId) || null;

    return {
      client,
      projects,
      activeProject,
      requirements,
      scopes,
      agreements,
      tasks,
      timeLogs,
      deliveries,
      revisions,
      changeRequests,
      handover,
      invoices,
      proposal,
      messages,
      logs,
      agent,
      recommendations,
    };
  },

  async getClientPortalBundle(token: string) {
    const data = await ensureDataFile();
    const client = data.clients.find(
      (c) => c.portal_token === token || (data.projects || []).some((p) => p.portal_token === token && p.client_id === c.id)
    );
    if (!client) return null;

    const clientId = client.id;
    const projects = (data.projects || []).filter((p) => p.client_id === clientId);
    const activeProject = projects.find((p) => p.portal_token === token) || projects[0] || null;
    const projectId = activeProject?.id || clientId;

    // Fix #12: Keep checks unified in project.checks
    if (activeProject && activeProject.checks) {
      client.checks = { ...activeProject.checks };
    }

    const requirements = (data.requirements || []).find((r) => r.project_id === projectId) || null;
    const scopes = (data.scopes || []).filter((s) => s.project_id === projectId);
    const agreements = (data.agreements || []).filter((a) => a.project_id === projectId);
    const invoices = (data.invoices || []).filter((i) => i.client_id === clientId || i.project_id === projectId);
    const deliveries = (data.deliveries || []).filter((d) => d.project_id === projectId);
    const revisions = (data.revision_rounds || []).filter((rr) => rr.project_id === projectId);
    const changeRequests = (data.change_requests || []).filter((cr) => cr.project_id === projectId);
    const handover = (data.handovers || []).find((h) => h.project_id === projectId) || null;
    const settings = data.settings;

    return {
      client,
      projects,
      activeProject,
      requirements,
      scopes,
      agreements,
      invoices,
      deliveries,
      revisions,
      changeRequests,
      handover,
      settings,
    };
  },

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const data = await ensureDataFile();
    const id = "c-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const token = "tok_" + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const newClient: Client = {
      id,
      name: clientData.name || "Untitled Lead",
      owner_name: clientData.owner_name || "",
      phone: clientData.phone || "",
      email: clientData.email || "",
      city: clientData.city || CITY,
      state: clientData.state || "Karnataka",
      niche: clientData.niche || "Local business",
      package: clientData.package || "growth",
      founding_offer: Boolean(clientData.founding_offer),
      notes: clientData.notes || "",
      next_step: clientData.next_step || "",
      next_step_date: clientData.next_step_date || "",
      status: "active",
      portal_token: token,
      consent_at: clientData.consent_at || now,
      source: clientData.source || "website_enquiry_form",
      outbound_count: 0,
      checks: clientData.checks || {},
      qualifying_answers: clientData.qualifying_answers,
      created_at: now,
      updated_at: now,
    };

    data.clients.unshift(newClient);

    // Also auto-create a matching Project for this client in v2
    const pkg = getPackageWithSettings(newClient.package, (data.settings as any)?.package_prices);
    const newProject: Project = {
      id: "proj-" + Date.now().toString(36),
      client_id: newClient.id,
      name: `${newClient.name} Project`,
      service_type: (newClient.qualifying_answers?.service_needed?.toLowerCase().includes("web") ? "website" : newClient.qualifying_answers?.service_needed?.toLowerCase().includes("app") ? "app" : "ai_agent"),
      package_id: newClient.package,
      price_paise: pkg.setupPaise || 3500000,
      monthly_paise: pkg.monthlyPaise || 0,
      founding_offer: newClient.founding_offer,
      milestone_plan: "50_50",
      revision_rounds_included: 2,
      revisions_used: 0,
      portal_token: token,
      status: "active",
      checks: newClient.checks,
      created_at: now,
      updated_at: now,
    };
    if (!data.projects) data.projects = [];
    data.projects.unshift(newProject);

    await writeData(data);

    await this.logActivity(
      "automation",
      "Lead & Project Created",
      `New lead registered for ${newClient.name} (${newClient.phone})`,
      newClient.id,
      { trigger_event: "website_enquiry_form", confidence_score: 1.0 }
    );

    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const data = await ensureDataFile();
    const index = data.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    data.clients[index] = {
      ...data.clients[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await writeData(data);
    return data.clients[index];
  },

  async deleteClient(id: string): Promise<boolean> {
    const data = await ensureDataFile();
    const initialLen = data.clients.length;
    data.clients = data.clients.filter((c) => c.id !== id);
    data.projects = (data.projects || []).filter((p) => p.client_id !== id);
    if (data.clients.length !== initialLen) {
      await writeData(data);
      await this.logActivity("user", "Client Removed", `Client ${id} was deleted`, id);
      return true;
    }
    return false;
  },

  // PROJECTS (v2 Multi-project pipeline)
  async getProjects(): Promise<Project[]> {
    const data = await ensureDataFile();
    return data.projects || [];
  },

  async getProjectsByClientId(clientId: string): Promise<Project[]> {
    const data = await ensureDataFile();
    return (data.projects || []).filter((p) => p.client_id === clientId || p.id === clientId);
  },

  async getProjectById(id: string): Promise<Project | null> {
    const data = await ensureDataFile();
    return (data.projects || []).find((p) => p.id === id || p.client_id === id) || null;
  },

  async getProjectByToken(token: string): Promise<Project | null> {
    const data = await ensureDataFile();
    return (data.projects || []).find((p) => p.portal_token === token) || null;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const data = await ensureDataFile();
    const id = "proj-" + Date.now().toString(36);
    const token = projectData.portal_token || "tok_" + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const pkg = getPackageWithSettings(projectData.package_id || "growth", (data.settings as any)?.package_prices);
    const newProject: Project = {
      id,
      client_id: projectData.client_id || "",
      name: projectData.name || "Untitled Project",
      service_type: projectData.service_type || "ai_agent",
      package_id: projectData.package_id || "growth",
      price_paise: projectData.price_paise ?? pkg.setupPaise,
      monthly_paise: projectData.monthly_paise ?? pkg.monthlyPaise,
      founding_offer: Boolean(projectData.founding_offer),
      milestone_plan: projectData.milestone_plan || "50_50",
      revision_rounds_included: 2,
      revisions_used: 0,
      portal_token: token,
      status: "active",
      checks: projectData.checks || {},
      created_at: now,
      updated_at: now,
    };

    if (!data.projects) data.projects = [];
    data.projects.unshift(newProject);
    await writeData(data);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const data = await ensureDataFile();
    if (!data.projects) data.projects = [];
    const index = data.projects.findIndex((p) => p.id === id || p.client_id === id);
    if (index === -1) return null;

    data.projects[index] = {
      ...data.projects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await writeData(data);
    return data.projects[index];
  },

  // CHECKLIST TICKS (v2 27-key derivation)
  async updateCheck(
    targetId: string, // clientId or projectId
    key: StageKey,
    done: boolean,
    doneBy: "user" | "automation" | "client" = "user"
  ): Promise<{ client?: Client; project?: Project } | null> {
    const founderOnlyKeys: StageKey[] = ["r1", "r2", "r3", "w2", "w3", "h1"];
    if (doneBy === "automation" && founderOnlyKeys.includes(key)) {
      await this.logActivity(
        "system",
        `Blocked automation tick on founder-only key ${key}`,
        `Automation attempted to tick founder-only checklist item ${key}. Blocked server-side.`,
        targetId
      );
      throw new Error(`Key ${key} is founder-only and cannot be ticked by automation`);
    }

    const data = await ensureDataFile();
    const now = getAppTimeISO();

    const client = data.clients.find((c) => c.id === targetId);
    const project = (data.projects || []).find((p) => p.id === targetId || p.client_id === targetId);

    // Bug 9: Server stage gates
    if (done) {
      const existingChecks = {
        ...(client?.checks || {}),
        ...(project?.checks || {}),
      };

      if (key === "w1") {
        if (!existingChecks.s1?.done || !existingChecks.s2?.done) {
          throw new Error("Stage gate violation: Stage w1 requires s1 (agreement accepted) and s2 (advance paid).");
        }
      }

      if (key === "v1") {
        if (!existingChecks.w3?.done) {
          throw new Error("Stage gate violation: Stage v1 requires w3 (initial delivery completed & shared).");
        }
      }

      if (key === "v3") {
        const hasDelivery = (data.deliveries || []).some(
          (d) => d.project_id === targetId || (project && d.project_id === project.id)
        );
        if (!hasDelivery && !existingChecks.w3?.done) {
          throw new Error("Stage gate violation: Stage v3 requires delivery to have been completed.");
        }
      }

      if (key === "f2") {
        if (!existingChecks.f1?.done) {
          throw new Error("Stage gate violation: Stage f2 requires f1 (final invoice issued).");
        }
        const finalPaid = (data.invoices || []).some(
          (i) =>
            (i.project_id === targetId ||
              (project && i.project_id === project.id) ||
              i.client_id === targetId ||
              (client && i.client_id === client.id)) &&
            i.type === "final" &&
            i.status === "paid"
        );
        if (!finalPaid) {
          throw new Error("Stage gate violation: Stage f2 requires a real final invoice to exist and be paid.");
        }
      }

      if (key === "h1" || key === "h2" || key === "h3") {
        if (!existingChecks.f2?.done) {
          throw new Error("Stage gate violation: Handover stages (h1, h2, h3) require f2 (final invoice paid).");
        }
      }
    }

    if (client) {
      if (!client.checks) client.checks = {};
      client.checks[key] = { key, done, done_at: done ? now : undefined, done_by: doneBy };
      client.updated_at = now;
    }

    if (project) {
      if (!project.checks) project.checks = {};
      project.checks[key] = { key, done, done_at: done ? now : undefined, done_by: doneBy };
      project.updated_at = now;
    }

    await writeData(data);

    await this.logActivity(
      doneBy,
      `Checklist ${key} ${done ? "completed" : "unmarked"}`,
      `${doneBy === "automation" ? "Automation" : doneBy === "client" ? "Client Portal" : "Founder"} marked ${key} as ${done ? "done" : "incomplete"}`,
      client?.id || project?.client_id
    );

    return { client: client || undefined, project: project || undefined };
  },

  // REQUIREMENTS (H1)
  async getRequirements(projectId: string): Promise<RequirementRecord | null> {
    const data = await ensureDataFile();
    return (data.requirements || []).find((r) => r.project_id === projectId) || null;
  },

  async saveRequirements(reqData: Partial<RequirementRecord> & { project_id: string }): Promise<RequirementRecord> {
    const data = await ensureDataFile();
    if (!data.requirements) data.requirements = [];
    const index = data.requirements.findIndex((r) => r.project_id === reqData.project_id);
    const now = new Date().toISOString();

    if (index >= 0) {
      data.requirements[index] = { ...data.requirements[index], ...reqData, updated_at: now };
      await writeData(data);
      return data.requirements[index];
    } else {
      const newReq: RequirementRecord = {
        id: "req-" + Date.now().toString(36),
        project_id: reqData.project_id,
        features: reqData.features || [],
        pages_screens: reqData.pages_screens || [],
        integrations: reqData.integrations || [],
        content_owner: reqData.content_owner || "",
        deadline: reqData.deadline,
        budget_paise: reqData.budget_paise || 0,
        recorded_consent: Boolean(reqData.recorded_consent),
        raw_notes: reqData.raw_notes || "",
        created_at: now,
        updated_at: now,
      };
      data.requirements.push(newReq);
      await writeData(data);
      return newReq;
    }
  },

  // SCOPE (Annex A)
  async getScope(projectId: string): Promise<ScopeRecord | null> {
    const data = await ensureDataFile();
    return (data.scopes || []).find((s) => s.project_id === projectId) || null;
  },

  async saveScope(scopeData: Partial<ScopeRecord> & { project_id: string }): Promise<ScopeRecord> {
    const data = await ensureDataFile();
    if (!data.scopes) data.scopes = [];
    const index = data.scopes.findIndex((s) => s.project_id === scopeData.project_id);
    const now = new Date().toISOString();

    if (index >= 0) {
      data.scopes[index] = { ...data.scopes[index], ...scopeData, updated_at: now };
      await writeData(data);
      return data.scopes[index];
    } else {
      const newScope: ScopeRecord = {
        id: "scope-" + Date.now().toString(36),
        project_id: scopeData.project_id,
        version: scopeData.version || 1,
        goal: scopeData.goal || "",
        deliverables: scopeData.deliverables || [],
        platforms: scopeData.platforms || ["Web"],
        languages: scopeData.languages || ["English", "Hindi"],
        limits: scopeData.limits || ["2 revision rounds included"],
        not_included: scopeData.not_included || [],
        client_provides: scopeData.client_provides || [],
        timeline_first_demo: scopeData.timeline_first_demo,
        timeline_handover: scopeData.timeline_handover,
        project_fee_paise: scopeData.project_fee_paise || 0,
        monthly_fee_paise: scopeData.monthly_fee_paise || 0,
        advance_paise: scopeData.advance_paise || 0,
        milestone_paise: scopeData.milestone_paise || 0,
        final_paise: scopeData.final_paise || 0,
        care_plan_paise: scopeData.care_plan_paise || 0,
        approved_by_founder: Boolean(scopeData.approved_by_founder),
        created_at: now,
        updated_at: now,
      };
      data.scopes.push(newScope);
      await writeData(data);
      return newScope;
    }
  },

  // AGREEMENT & OTP ACCEPTANCE (Section 8)
  async getAgreement(projectId: string): Promise<AgreementRecord | null> {
    const data = await ensureDataFile();
    return (data.agreements || []).find((a) => a.project_id === projectId) || null;
  },

  async getRequirementsByProjectId(projectId: string): Promise<RequirementRecord | null> {
    return this.getRequirements(projectId);
  },

  async getScopesByProjectId(projectId: string): Promise<ScopeRecord[]> {
    const s = await this.getScope(projectId);
    return s ? [s] : [];
  },

  async getAgreementsByProjectId(projectId: string): Promise<AgreementRecord[]> {
    const a = await this.getAgreement(projectId);
    return a ? [a] : [];
  },

  async saveAgreement(agrData: Partial<AgreementRecord> & { project_id: string }): Promise<AgreementRecord> {
    const data = await ensureDataFile();
    if (!data.agreements) data.agreements = [];
    const index = data.agreements.findIndex((a) => a.project_id === agrData.project_id);
    const now = new Date().toISOString();

    if (index >= 0) {
      data.agreements[index] = { ...data.agreements[index], ...agrData, updated_at: now };
      await writeData(data);
      return data.agreements[index];
    } else {
      const newAgr: AgreementRecord = {
        id: "agr-" + Date.now().toString(36),
        project_id: agrData.project_id,
        client_id: agrData.client_id || "",
        version: agrData.version || 1,
        status: agrData.status || "draft",
        pdf_url: agrData.pdf_url || `/api/agreements/agr-${Date.now().toString(36)}/pdf`,
        document_hash: agrData.document_hash,
        created_at: now,
        updated_at: now,
      };
      data.agreements.push(newAgr);
      await writeData(data);
      return newAgr;
    }
  },

  async recordAgreementAcceptance(record: Omit<AgreementAcceptanceRecord, "id" | "created_at">): Promise<AgreementAcceptanceRecord> {
    const data = await ensureDataFile();
    if (!data.agreement_acceptances) data.agreement_acceptances = [];
    const newAcc: AgreementAcceptanceRecord = {
      id: "acc-" + Date.now().toString(36),
      ...record,
      created_at: new Date().toISOString(),
    };
    data.agreement_acceptances.unshift(newAcc);

    // Update agreement status to accepted
    const agr = (data.agreements || []).find((a) => a.id === record.agreement_id || a.project_id === record.project_id);
    if (agr) {
      agr.status = "accepted";
      agr.document_hash = record.document_hash;
    }

    // Tick s1 on project and client
    await this.updateCheck(record.project_id, "s1", true, "client");

    await writeData(data);
    return newAcc;
  },

  // TASKS & TIME LOGGING (/admin/work)
  async getTasks(projectId?: string): Promise<TaskRecord[]> {
    const data = await ensureDataFile();
    let tasks = data.tasks || [];
    if (projectId) {
      tasks = tasks.filter((t) => t.project_id === projectId);
    }
    return tasks;
  },

  async createTask(taskData: Partial<TaskRecord> & { project_id: string; title: string }): Promise<TaskRecord> {
    const data = await ensureDataFile();
    if (!data.tasks) data.tasks = [];
    const id = "task-" + Date.now().toString(36);
    const now = new Date().toISOString();

    const newTask: TaskRecord = {
      id,
      project_id: taskData.project_id,
      title: taskData.title,
      category: taskData.category || "build",
      hours_estimated: taskData.hours_estimated || 1,
      due_date: taskData.due_date,
      done: false,
      created_at: now,
      updated_at: now,
    };
    data.tasks.unshift(newTask);
    await writeData(data);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<TaskRecord>): Promise<TaskRecord | null> {
    const data = await ensureDataFile();
    if (!data.tasks) return null;
    const index = data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    data.tasks[index] = { ...data.tasks[index], ...updates, updated_at: new Date().toISOString() };
    await writeData(data);
    return data.tasks[index];
  },

  async getTimeLogs(projectId?: string): Promise<TimeLogRecord[]> {
    const data = await ensureDataFile();
    let logs = data.time_logs || [];
    if (projectId) {
      logs = logs.filter((l) => l.project_id === projectId);
    }
    return logs;
  },

  async logTime(logData: Omit<TimeLogRecord, "id" | "created_at">): Promise<TimeLogRecord> {
    const data = await ensureDataFile();
    if (!data.time_logs) data.time_logs = [];
    const newLog: TimeLogRecord = {
      id: "time-" + Date.now().toString(36),
      ...logData,
      created_at: new Date().toISOString(),
    };
    data.time_logs.unshift(newLog);
    await writeData(data);
    return newLog;
  },

  // DELIVERIES & REVISION ENGINE (Section 7)
  async getDeliveries(projectId: string): Promise<DeliveryRecord[]> {
    const data = await ensureDataFile();
    return (data.deliveries || []).filter((d) => d.project_id === projectId);
  },

  async createDelivery(delData: Omit<DeliveryRecord, "id">): Promise<DeliveryRecord> {
    const data = await ensureDataFile();
    if (!data.deliveries) data.deliveries = [];
    const newDel: DeliveryRecord = {
      id: "del-" + Date.now().toString(36),
      ...delData,
    };
    data.deliveries.unshift(newDel);

    // Ticks w3 (Delivery shared)
    await this.updateCheck(delData.project_id, "w3", true, "user");

    await writeData(data);
    return newDel;
  },

  async getRevisionRounds(projectId: string): Promise<RevisionRoundRecord[]> {
    const data = await ensureDataFile();
    return (data.revision_rounds || []).filter((r) => r.project_id === projectId);
  },

  async submitRevisionRound(
    projectId: string,
    roundNumber: number,
    items: { text: string; ai_label: "revision" | "new_feature"; ai_reason: string }[]
  ): Promise<RevisionRoundRecord> {
    const data = await ensureDataFile();
    const proj = (data.projects || []).find((p) => p.id === projectId || p.client_id === projectId);
    if (!proj) throw new Error("Project not found");

    // Bug 8: Server revision limits - refuse if w3 not done
    if (!proj.checks?.w3?.done) {
      throw new Error("Revision rounds cannot be submitted before the initial build (w3) has been delivered and shared.");
    }

    // Bug 8: Refuse if revisions_used >= included
    const included = proj.revision_rounds_included || 2;
    const used = proj.revisions_used || 0;
    if (used >= included) {
      throw new Error(`All ${included} included revision rounds have been used. Additional changes must be requested as a paid Change Request at ₹1,000/hr.`);
    }

    if (!data.revision_rounds) data.revision_rounds = [];
    const roundId = "rev-" + Date.now().toString(36);

    const revisionItems: RevisionItemRecord[] = items.map((item, idx) => ({
      id: `item-${idx + 1}-${Date.now().toString(36)}`,
      round_id: roundId,
      text: item.text,
      ai_label: item.ai_label,
      ai_reason: item.ai_reason,
      founder_confirmed: false,
      is_change_request: item.ai_label === "new_feature",
    }));

    const newRound: RevisionRoundRecord = {
      id: roundId,
      project_id: projectId,
      round_number: roundNumber,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      items: revisionItems,
    };

    data.revision_rounds.push(newRound);

    // Increment project revisions_used counter
    if (proj) {
      proj.revisions_used = Math.max(proj.revisions_used || 0, roundNumber);
    }

    await writeData(data);
    return newRound;
  },

  async confirmRevisionItem(
    roundId: string,
    itemId: string,
    label: "revision" | "new_feature",
    quoteHours?: number
  ): Promise<void> {
    const data = await ensureDataFile();
    for (const round of data.revision_rounds || []) {
      const item = round.items.find((i) => i.id === itemId);
      if (item) {
        item.ai_label = label;
        item.founder_confirmed = true;
        item.is_change_request = label === "new_feature";

        if (label === "new_feature" && quoteHours) {
          const rate = data.settings.hourly_change_rate_inr || 1000;
          const cr: ChangeRequestRecord = {
            id: "cr-" + Date.now().toString(36),
            project_id: round.project_id,
            title: `Change Request: ${item.text.slice(0, 40)}…`,
            description: item.text,
            hours_quoted: quoteHours,
            amount_paise: quoteHours * rate * 100,
            status: "quoted",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (!data.change_requests) data.change_requests = [];
          data.change_requests.unshift(cr);
          item.change_request_id = cr.id;
        }
        break;
      }
    }
    await writeData(data);
  },

  async getChangeRequests(projectId: string): Promise<ChangeRequestRecord[]> {
    const data = await ensureDataFile();
    return (data.change_requests || []).filter((c) => c.project_id === projectId);
  },

  // PROPOSALS (Backward compatibility)
  async getProposalByClientId(clientId: string): Promise<Proposal | null> {
    const data = await ensureDataFile();
    return (data.proposals || []).find((p) => p.client_id === clientId || p.project_id === clientId) || null;
  },

  async createProposal(proposalData: Partial<Proposal>): Promise<Proposal> {
    const data = await ensureDataFile();
    const newProposal: Proposal = {
      id: "prop-" + Date.now().toString(36),
      client_id: proposalData.client_id || "",
      version: proposalData.version || 1,
      package_id: proposalData.package_id || "growth",
      setup_paise: proposalData.setup_paise || 3500000,
      monthly_paise: proposalData.monthly_paise || 1999900,
      status: proposalData.status || "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...proposalData,
    };
    if (!data.proposals) data.proposals = [];
    data.proposals.unshift(newProposal);
    await writeData(data);
    return newProposal;
  },

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal | null> {
    const data = await ensureDataFile();
    if (!data.proposals) data.proposals = [];
    const idx = data.proposals.findIndex((p) => p.id === id || p.client_id === id);
    if (idx === -1) return null;
    data.proposals[idx] = { ...data.proposals[idx], ...updates, updated_at: new Date().toISOString() };
    await writeData(data);
    return data.proposals[idx];
  },

  // HANDOVERS (Annex B)
  async getHandover(projectId: string): Promise<HandoverRecord | null> {
    const data = await ensureDataFile();
    return (data.handovers || []).find((h) => h.project_id === projectId) || null;
  },

  async saveHandover(handData: Partial<HandoverRecord> & { project_id: string }): Promise<HandoverRecord> {
    const data = await ensureDataFile();
    if (!data.handovers) data.handovers = [];
    const index = data.handovers.findIndex((h) => h.project_id === handData.project_id);
    const now = new Date().toISOString();

    if (index >= 0) {
      data.handovers[index] = { ...data.handovers[index], ...handData, updated_at: now };
      await writeData(data);
      return data.handovers[index];
    } else {
      const newHand: HandoverRecord = {
        id: "hand-" + Date.now().toString(36),
        project_id: handData.project_id,
        invoice_paid: Boolean(handData.invoice_paid),
        domain_transferred: Boolean(handData.domain_transferred),
        source_code_transferred: Boolean(handData.source_code_transferred),
        agent_exported: Boolean(handData.agent_exported),
        care_plan_active: Boolean(handData.care_plan_active),
        client_confirmed: Boolean(handData.client_confirmed),
        created_at: now,
        updated_at: now,
      };
      data.handovers.push(newHand);
      await writeData(data);
      return newHand;
    }
  },

  // SPENDING CAPS & USAGE COSTS
  async getUsageCosts(): Promise<UsageCostRecord[]> {
    const data = await ensureDataFile();
    return data.usage_costs || [];
  },

  async recordUsageCost(cost: Omit<UsageCostRecord, "id" | "created_at">): Promise<UsageCostRecord> {
    const data = await ensureDataFile();
    if (!data.usage_costs) data.usage_costs = [];
    const newCost: UsageCostRecord = {
      id: "cost-" + Date.now().toString(36),
      ...cost,
      created_at: new Date().toISOString(),
    };
    data.usage_costs.unshift(newCost);
    await writeData(data);
    return newCost;
  },

  // INVOICES (with GST on/off switch awareness)
  async getInvoices(): Promise<Invoice[]> {
    const data = await ensureDataFile();
    return data.invoices;
  },

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    const data = await ensureDataFile();
    return data.invoices.filter((i) => i.client_id === clientId || i.project_id === clientId);
  },

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const data = await ensureDataFile();
    // Bug 3: Random unguessable invoice IDs
    const id = "inv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    const invoiceNumber = `AW/2026-27/${String(data.invoices.length + 1).padStart(4, "0")}`;
    const now = new Date().toISOString();

    const isGst = Boolean(data.settings.gst_registered);
    // Bug 4: Whole rupee arithmetic
    const subtotalRupees = Math.round((invoiceData.subtotal_paise || 0) / 100);
    const subtotalPaise = subtotalRupees * 100;

    const client = (data.clients || []).find((c) => c.id === invoiceData.client_id);
    const founderState = (data.settings.state || "Karnataka").toLowerCase().trim();
    const clientState = (client?.state || "Karnataka").toLowerCase().trim();
    const isInterState = isGst && (founderState !== clientState);

    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    if (isGst) {
      if (isInterState) {
        igstPaise = Math.round(subtotalRupees * 0.18) * 100;
      } else {
        cgstPaise = Math.round(subtotalRupees * 0.09) * 100;
        sgstPaise = cgstPaise; // SGST = same as CGST
      }
    }

    const totalPaise = subtotalPaise + (isInterState ? igstPaise : cgstPaise + sgstPaise);

    const newInvoice: Invoice = {
      id,
      client_id: invoiceData.client_id || "",
      project_id: invoiceData.project_id,
      invoice_number: invoiceData.invoice_number || invoiceNumber,
      type: invoiceData.type || "advance",
      subtotal_paise: subtotalPaise,
      is_gst: isGst,
      cgst_paise: cgstPaise,
      sgst_paise: sgstPaise,
      igst_paise: igstPaise,
      total_paise: totalPaise,
      status: invoiceData.status || "draft",
      due_date: invoiceData.due_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      razorpay_payment_url: invoiceData.razorpay_payment_url,
      pdf_url: `/api/invoices/${id}/pdf`,
      created_at: now,
      updated_at: now,
    };

    data.invoices.unshift(newInvoice);
    await writeData(data);

    await this.logActivity(
      "automation",
      "Invoice Generated",
      `Invoice ${newInvoice.invoice_number} generated for ${formatINR(newInvoice.total_paise / 100)} (${isGst ? "GST Registered" : "Bill of Supply - Not registered under GST"})`,
      newInvoice.client_id
    );

    return newInvoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const data = await ensureDataFile();
    const index = data.invoices.findIndex((i) => i.id === id);
    if (index === -1) return null;

    data.invoices[index] = {
      ...data.invoices[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await writeData(data);
    return data.invoices[index];
  },

  // MESSAGES
  async getMessages(clientId?: string): Promise<MessageRecord[]> {
    const data = await ensureDataFile();
    if (clientId) {
      return data.messages.filter((m) => m.client_id === clientId || m.project_id === clientId);
    }
    return data.messages;
  },

  async createMessage(msg: Partial<MessageRecord>): Promise<MessageRecord | null> {
    const data = await ensureDataFile();

    // Safety Rule 1: Check Global Outbound Kill Switch
    if (msg.direction === "outbound" && data.settings.pause_all_outbound) {
      await this.logActivity(
        "system",
        "Outbound Message Suppressed",
        `[KILL SWITCH ACTIVE] Outbound message to client ${msg.client_id} was blocked.`,
        msg.client_id
      );
      return null;
    }

    // Safety Rule 5: Check if client follow-ups are paused due to inbound reply
    if (msg.direction === "outbound" && msg.client_id) {
      const client = data.clients.find((c) => c.id === msg.client_id);
      if (client?.paused_follow_ups_until) {
        const pauseEnd = new Date(client.paused_follow_ups_until).getTime();
        if (Date.now() < pauseEnd) {
          await this.logActivity(
            "system",
            "Follow-up Paused (Client Reply Rule)",
            `Pending follow-up paused for ${client.name} until ${client.paused_follow_ups_until}`,
            client.id
          );
          return null;
        }
      }
    }

    const id = "msg-" + Date.now().toString(36);
    const newMsg: MessageRecord = {
      id,
      client_id: msg.client_id || "",
      project_id: msg.project_id,
      direction: msg.direction || "outbound",
      channel: msg.channel || "whatsapp",
      template: msg.template,
      body: msg.body || "",
      status: msg.status || "sent",
      created_at: new Date().toISOString(),
    };

    data.messages.unshift(newMsg);

    if (msg.direction === "outbound" && msg.client_id) {
      const client = data.clients.find((c) => c.id === msg.client_id);
      if (client) {
        client.outbound_count = (client.outbound_count || 0) + 1;
      }
    }

    await writeData(data);
    return newMsg;
  },

  // AGENTS
  async getAgentByClientId(clientId: string): Promise<AgentRecord | null> {
    const data = await ensureDataFile();
    return (data.agents || []).find((a) => a.client_id === clientId || a.project_id === clientId) || null;
  },

  async saveAgent(agentData: Partial<AgentRecord> & { client_id: string }): Promise<AgentRecord> {
    const data = await ensureDataFile();
    if (!data.agents) data.agents = [];
    const index = data.agents.findIndex((a) => a.client_id === agentData.client_id);
    const now = new Date().toISOString();

    if (index >= 0) {
      data.agents[index] = { ...data.agents[index], ...agentData, updated_at: now };
      await writeData(data);
      return data.agents[index];
    } else {
      const newAgent: AgentRecord = {
        id: "ag-" + Date.now().toString(36),
        client_id: agentData.client_id,
        project_id: agentData.project_id,
        niche: agentData.niche || "clinic",
        prompt: agentData.prompt || "",
        knowledge_base: agentData.knowledge_base || "",
        test_report: agentData.test_report,
        status: agentData.status || "draft",
        created_at: now,
        updated_at: now,
      };
      data.agents.push(newAgent);
      await writeData(data);
      return newAgent;
    }
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 30, clientId?: string): Promise<ActivityLogRecord[]> {
    const data = await ensureDataFile();
    let logs = data.activity_log;
    if (clientId) {
      logs = logs.filter((l) => l.client_id === clientId || l.project_id === clientId);
    }
    return logs.slice(0, limit);
  },

  async logActivity(
    actor: "user" | "automation" | "client" | "system",
    action: string,
    detail: string,
    clientId?: string,
    extra?: {
      trigger_event?: string;
      ai_input?: string;
      ai_output?: string;
      confidence_score?: number;
      shadow?: boolean;
    }
  ): Promise<ActivityLogRecord> {
    const data = await ensureDataFile();
    const newLog: ActivityLogRecord = {
      id: "log-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      client_id: clientId,
      actor,
      action,
      detail,
      trigger_event: extra?.trigger_event,
      ai_input: extra?.ai_input,
      ai_output: extra?.ai_output,
      confidence_score: extra?.confidence_score ?? 1.0,
      shadow: extra?.shadow ?? false,
      created_at: new Date().toISOString(),
    };
    data.activity_log.unshift(newLog);
    await writeData(data);
    return newLog;
  },

  // JOBS (Queue with Idempotency)
  async getJobs(): Promise<JobRecord[]> {
    const data = await ensureDataFile();
    return data.jobs;
  },

  async enqueueJob(job: Partial<JobRecord>): Promise<{ queued: boolean; job: JobRecord }> {
    const data = await ensureDataFile();

    // Safety Rule 3: Idempotency Key check
    if (job.idempotency_key) {
      const existing = data.jobs.find((j) => j.idempotency_key === job.idempotency_key);
      if (existing) {
        await this.logActivity(
          "system",
          "Duplicate Job Ignored (Idempotency Rule)",
          `Skipped duplicate job with key: ${job.idempotency_key}`,
          job.client_id
        );
        return { queued: false, job: existing };
      }
    }

    const id = "job-" + Date.now().toString(36);
    const newJob: JobRecord = {
      id,
      idempotency_key: job.idempotency_key,
      type: job.type || "generic",
      client_id: job.client_id,
      project_id: job.project_id,
      payload: job.payload,
      run_at: job.run_at || new Date().toISOString(),
      attempts: 0,
      max_attempts: job.max_attempts || 3,
      level: job.level || 1,
      shadow_mode: Boolean(job.shadow_mode),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.jobs.unshift(newJob);
    await writeData(data);
    return { queued: true, job: newJob };
  },

  // AUTOMATIONS
  async getAutomations(): Promise<AutomationSetting[]> {
    const data = await ensureDataFile();
    return data.automations;
  },

  async toggleAutomation(id: string, enabled: boolean): Promise<AutomationSetting | null> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (!auto) return null;
    auto.enabled = enabled;
    await writeData(data);
    await this.logActivity("user", "Automation Toggled", `Automation ${id} set to ${enabled ? "enabled" : "disabled"}`);
    return auto;
  },

  async toggleShadowMode(id: string, shadow: boolean): Promise<AutomationSetting | null> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (!auto) return null;
    auto.shadow_mode = shadow;
    await writeData(data);
    await this.logActivity("user", "Shadow Mode Toggled", `Automation ${id} shadow mode set to ${shadow}`);
    return auto;
  },

  async promoteAutomation(id: string): Promise<AutomationSetting | null> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (!auto) return null;
    if (auto.level === 2) {
      auto.level = 1;
      auto.can_promote = false;
      await writeData(data);
      await this.logActivity("user", "Automation Promoted", `Automation ${id} promoted to Level 1 (Auto)`);
    }
    return auto;
  },

  async demoteAutomation(id: string, newLevel: 1 | 2 | 3): Promise<AutomationSetting | null> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (!auto) return null;
    auto.level = newLevel;
    auto.consecutive_no_edit_approvals = 0;
    auto.can_promote = false;
    await writeData(data);
    await this.logActivity("user", "Automation Demoted", `Automation ${id} demoted to Level ${newLevel}`);
    return auto;
  },

  async recordApprovalDecision(id: string, edited: boolean): Promise<void> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (auto && auto.level === 2) {
      if (edited) {
        auto.consecutive_no_edit_approvals = 0;
      } else {
        auto.consecutive_no_edit_approvals += 1;
        if (auto.consecutive_no_edit_approvals >= 15) {
          auto.can_promote = true;
        }
      }
      await writeData(data);
    }
  },

  async recordAutomationRun(id: string, success: boolean): Promise<void> {
    const data = await ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (auto) {
      auto.last_run = new Date().toISOString();
      if (success) auto.success_count += 1;
      else auto.failure_count += 1;
      await writeData(data);
    }
  },

  // RECOMMENDATIONS (AI COPILOT)
  async getRecommendations(status = "active"): Promise<Recommendation[]> {
    const data = await ensureDataFile();
    let recs = data.recommendations || [];
    if (status !== "all") {
      recs = recs.filter((r) => r.status === status);
    }
    return recs;
  },

  async createRecommendation(rec: Partial<Recommendation>): Promise<Recommendation> {
    const data = await ensureDataFile();
    const id = "rec-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
    const newRec: Recommendation = {
      id,
      client_id: rec.client_id,
      project_id: rec.project_id,
      client_name: rec.client_name,
      type: rec.type || "forgotten_step",
      title: rec.title || "Next Best Action",
      reason: rec.reason || "",
      why_rule: rec.why_rule,
      action_label: rec.action_label || "Take Action",
      action_type: rec.action_type || "navigate",
      action_payload: rec.action_payload,
      priority: rec.priority || "medium",
      money_at_risk_rupees: rec.money_at_risk_rupees,
      status: "active",
      created_at: new Date().toISOString(),
    };

    if (!data.recommendations) data.recommendations = [];
    data.recommendations.unshift(newRec);
    await writeData(data);
    return newRec;
  },

  async updateRecommendationStatus(
    id: string,
    status: "active" | "snoozed" | "dismissed" | "acted"
  ): Promise<Recommendation | null> {
    const data = await ensureDataFile();
    if (!data.recommendations) return null;
    const rec = data.recommendations.find((r) => r.id === id);
    if (!rec) return null;

    rec.status = status;
    if (status === "acted") {
      rec.acted_at = new Date().toISOString();
    } else if (status === "snoozed") {
      rec.snoozed_until = new Date(Date.now() + 86400000).toISOString();
    }
    await writeData(data);
    return rec;
  },

  // SETTINGS & GLOBAL CONTROLS
  async getSettings(): Promise<Settings> {
    const data = await ensureDataFile();
    return data.settings;
  },

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const data = await ensureDataFile();

    // Bug 5: Block turning GST on without valid GSTIN
    if (updates.gst_registered === true) {
      const gstinCandidate = (updates.gstin !== undefined ? updates.gstin : data.settings.gstin || "").trim();
      const gstRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
      if (!gstRegex.test(gstinCandidate)) {
        throw new Error("Cannot enable GST without a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).");
      }
    }

    const wasPaused = Boolean(data.settings.pause_all_outbound);
    data.settings = { ...data.settings, ...updates };
    await writeData(data);

    // Bug 7: Send queued once upon resume
    if (wasPaused && updates.pause_all_outbound === false) {
      await this.flushQueuedMessages();
    }

    await this.logActivity("user", "Settings Updated", "Business settings and GST configuration updated");
    return data.settings;
  },

  async toggleGlobalKillSwitch(pause: boolean): Promise<boolean> {
    const data = await ensureDataFile();
    const wasPaused = Boolean(data.settings.pause_all_outbound);
    data.settings.pause_all_outbound = pause;
    await writeData(data);

    // Bug 7: Send queued once upon resume
    if (wasPaused && !pause) {
      await this.flushQueuedMessages();
    }

    await this.logActivity(
      "user",
      pause ? "Global Kill Switch Activated" : "Global Kill Switch Deactivated",
      pause
        ? "All outbound WhatsApp and email communications paused across the system."
        : "Outbound messaging resumed."
    );
    return pause;
  },

  // ==========================================
  // SECTION 15 ZERO-TOUCH UPGRADE REPOSITORIES
  // (Forward-compatible for Phases 10-12)
  // ==========================================

  // Z3: Templates Library
  async getTemplates(niche?: string): Promise<TemplateRecord[]> {
    const data = await ensureDataFile();
    const list = data.templates_library || [];
    return niche ? list.filter((t) => t.niche === niche) : list;
  },

  async saveTemplate(template: Omit<TemplateRecord, "id" | "created_at" | "updated_at">): Promise<TemplateRecord> {
    const data = await ensureDataFile();
    if (!data.templates_library) data.templates_library = [];
    const now = new Date().toISOString();
    const newTmpl: TemplateRecord = {
      id: "tmpl-" + Date.now().toString(36),
      ...template,
      created_at: now,
      updated_at: now,
    };
    data.templates_library.unshift(newTmpl);
    await writeData(data);
    return newTmpl;
  },

  // Z5: Automated Quality Checks
  async getQualityChecks(projectId: string): Promise<QualityCheckRecord[]> {
    const data = await ensureDataFile();
    return (data.quality_checks || []).filter((q) => q.project_id === projectId);
  },

  async recordQualityCheck(qc: Omit<QualityCheckRecord, "id" | "created_at">): Promise<QualityCheckRecord> {
    const data = await ensureDataFile();
    if (!data.quality_checks) data.quality_checks = [];
    const newQc: QualityCheckRecord = {
      id: "qc-" + Date.now().toString(36),
      ...qc,
      created_at: new Date().toISOString(),
    };
    data.quality_checks.unshift(newQc);
    await writeData(data);
    return newQc;
  },

  // Z6: Content Versions & Previews
  async getContentVersions(projectId: string): Promise<ContentVersionRecord[]> {
    const data = await ensureDataFile();
    return (data.content_versions || []).filter((cv) => cv.project_id === projectId);
  },

  async saveContentVersion(cv: Omit<ContentVersionRecord, "id" | "created_at">): Promise<ContentVersionRecord> {
    const data = await ensureDataFile();
    if (!data.content_versions) data.content_versions = [];
    const newCv: ContentVersionRecord = {
      id: "cv-" + Date.now().toString(36),
      ...cv,
      created_at: new Date().toISOString(),
    };
    data.content_versions.unshift(newCv);
    await writeData(data);
    return newCv;
  },

  // Z10: Books & GST Ledger
  async getLedgerEntries(projectId?: string): Promise<LedgerEntryRecord[]> {
    const data = await ensureDataFile();
    const list = data.ledger || [];
    return projectId ? list.filter((l) => l.project_id === projectId) : list;
  },

  async recordLedgerEntry(entry: Omit<LedgerEntryRecord, "id" | "created_at">): Promise<LedgerEntryRecord> {
    const data = await ensureDataFile();
    if (!data.ledger) data.ledger = [];
    const newEntry: LedgerEntryRecord = {
      id: "ledg-" + Date.now().toString(36),
      ...entry,
      created_at: new Date().toISOString(),
    };
    data.ledger.unshift(newEntry);
    await writeData(data);
    return newEntry;
  },

  // Z11: Freelancer Overflow
  async getFreelancers(): Promise<FreelancerRecord[]> {
    const data = await ensureDataFile();
    return data.freelancers || [];
  },

  async createFreelancer(fData: Omit<FreelancerRecord, "id" | "created_at" | "updated_at">): Promise<FreelancerRecord> {
    const data = await ensureDataFile();
    if (!data.freelancers) data.freelancers = [];
    const now = new Date().toISOString();
    const newF: FreelancerRecord = {
      id: "free-" + Date.now().toString(36),
      ...fData,
      created_at: now,
      updated_at: now,
    };
    data.freelancers.unshift(newF);
    await writeData(data);
    return newF;
  },

  async updateFreelancer(id: string, updates: Partial<FreelancerRecord>): Promise<FreelancerRecord | null> {
    const data = await ensureDataFile();
    if (!data.freelancers) data.freelancers = [];
    const idx = data.freelancers.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    data.freelancers[idx] = { ...data.freelancers[idx], ...updates, updated_at: new Date().toISOString() };
    await writeData(data);
    return data.freelancers[idx];
  },

  // QA Test Tools: Outbox & Dev Settings
  async getOutbox(projectId?: string): Promise<OutboxItem[]> {
    const data = await ensureDataFile();
    const list = data.outbox || [];
    if (projectId) {
      return list.filter((item) => item.project_id === projectId || item.client_id === projectId);
    }
    return list;
  },

  async recordOutbox(item: Omit<OutboxItem, "id" | "created_at">): Promise<OutboxItem> {
    const data = await ensureDataFile();
    if (!data.outbox) data.outbox = [];
    const newItem: OutboxItem = {
      id: "out-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      status: item.status || "sent",
      ...item,
      created_at: getAppTimeISO(),
    };
    data.outbox.unshift(newItem);
    await writeData(data);
    return newItem;
  },

  async clearOutbox(projectId?: string): Promise<void> {
    const data = await ensureDataFile();
    if (projectId) {
      data.outbox = (data.outbox || []).filter(
        (item) => item.project_id !== projectId && item.client_id !== projectId
      );
    } else {
      data.outbox = [];
    }
    await writeData(data);
  },

  // Bug 1: OTP Store & Verification
  async saveOtp(projectId: string, phone: string, clientId?: string): Promise<{ otp: string; record: OtpRecord }> {
    const data = await ensureDataFile();
    if (!data.otps) data.otps = [];

    // Invalidate earlier unused OTPs for this project
    for (const o of data.otps) {
      if ((o.project_id === projectId || o.client_id === clientId) && !o.used) {
        o.used = true;
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const record: OtpRecord = {
      id: "otp-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      project_id: projectId,
      client_id: clientId,
      phone,
      otp: code,
      attempts: 0,
      max_attempts: 5,
      expires_at: now + 10 * 60 * 1000, // 10 minutes
      used: false,
      created_at: getAppTimeISO(),
    };
    data.otps.unshift(record);
    await writeData(data);
    return { otp: code, record };
  },

  async verifyOtp(projectId: string, inputCode: string): Promise<{ valid: boolean; error?: string }> {
    const data = await ensureDataFile();
    if (!data.otps) data.otps = [];
    const record = data.otps.find((o) => (o.project_id === projectId || o.client_id === projectId) && !o.used);
    if (!record) {
      return { valid: false, error: "No active OTP found. Please request a new code." };
    }
    const now = Date.now();
    if (now > record.expires_at) {
      record.used = true;
      await writeData(data);
      return { valid: false, error: "OTP has expired (valid for 10 minutes). Please request a new code." };
    }
    if (record.attempts >= record.max_attempts) {
      record.used = true;
      await writeData(data);
      return { valid: false, error: "Maximum verification attempts (5) exceeded. Please request a new code." };
    }

    if (record.otp !== inputCode.trim()) {
      record.attempts += 1;
      await writeData(data);
      const remaining = record.max_attempts - record.attempts;
      return {
        valid: false,
        error: `Incorrect OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Maximum attempts reached. Please request a new code."}`,
      };
    }

    record.used = true;
    await writeData(data);
    return { valid: true };
  },

  // Bug 6: Idempotency Key Management
  hasIdempotencyKey(key: string): boolean {
    const data = memoryCache || getInitialSeed();
    return Boolean(data.idempotency_keys?.includes(key));
  },

  recordIdempotencyKey(key: string): void {
    if (!memoryCache) {
      memoryCache = getInitialSeed();
    }
    if (!memoryCache.idempotency_keys) memoryCache.idempotency_keys = [];
    if (!memoryCache.idempotency_keys.includes(key)) {
      memoryCache.idempotency_keys.push(key);
      writeData(memoryCache).catch(console.error);
    }
  },

  // Bug 7: Flush Queued Messages
  async flushQueuedMessages(): Promise<number> {
    const data = await ensureDataFile();
    let flushedCount = 0;
    if (data.outbox) {
      for (const item of data.outbox) {
        if (item.status === "queued") {
          item.status = "sent";
          item.created_at = getAppTimeISO();
          flushedCount++;
        }
      }
    }
    if (flushedCount > 0) {
      await writeData(data);
      await this.logActivity("system", "Queued Messages Dispatched", `Resumed outbound dispatch: ${flushedCount} queued message(s) sent.`);
    }
    return flushedCount;
  },

  async getDevSettings(): Promise<DevSettings> {
    const data = await ensureDataFile();
    if (!data.dev_settings) {
      data.dev_settings = {
        force_failure: {},
        integrations: {
          whatsapp: "mock",
          email: "mock",
          razorpay: "mock",
          cal: "mock",
          ai: "mock",
        },
      };
      await writeData(data);
    }
    return data.dev_settings;
  },

  async updateDevSettings(updates: Partial<DevSettings>): Promise<DevSettings> {
    const data = await ensureDataFile();
    const current = await this.getDevSettings();
    data.dev_settings = {
      ...current,
      ...updates,
      force_failure: {
        ...current.force_failure,
        ...(updates.force_failure || {}),
      },
      integrations: {
        ...current.integrations,
        ...(updates.integrations || {}),
      },
    };
    await writeData(data);
    return data.dev_settings;
  },

  async resetDemoData(): Promise<void> {
    const freshSeed = getInitialSeed();
    await writeData(freshSeed);
  },

  async getAutomationRuns(automationId?: string): Promise<AutomationRunRecord[]> {
    const data = await ensureDataFile();
    const runs = data.automation_runs || [];
    if (automationId) {
      return runs.filter((r) => r.automation_id === automationId).slice(0, 20);
    }
    return runs.slice(0, 50);
  },

  async recordAutomationRunEntry(entry: Omit<AutomationRunRecord, "id" | "created_at" | "run_time" | "run_time_ist">): Promise<AutomationRunRecord> {
    const data = await ensureDataFile();
    if (!data.automation_runs) data.automation_runs = [];
    const nowIso = getAppTimeISO();
    const nowIst = getAppTimeIST();
    const newRun: AutomationRunRecord = {
      id: "run-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      run_time: nowIso,
      run_time_ist: nowIst,
      created_at: nowIso,
      ...entry,
    };
    data.automation_runs.unshift(newRun);
    if (data.automation_runs.length > 500) {
      data.automation_runs = data.automation_runs.slice(0, 500);
    }
    await writeData(data);
    return newRun;
  },
};
