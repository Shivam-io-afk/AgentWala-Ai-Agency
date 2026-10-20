import fs from "fs";
import path from "path";
import {
  Client,
  Invoice,
  Proposal,
  MessageRecord,
  AgentRecord,
  JobRecord,
  ActivityLogRecord,
  AutomationSetting,
  StageKey,
} from "./types";
import { calculateBill, rupeesToPaise } from "./pricing";
import { DEMO_NUMBER, WHATSAPP_NUMBER, EMAIL, CITY, FOUNDER_NAME, SITE_CONFIG } from "@/content/site";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  clients: Client[];
  invoices: Invoice[];
  proposals: Proposal[];
  messages: MessageRecord[];
  agents: AgentRecord[];
  jobs: JobRecord[];
  activity_log: ActivityLogRecord[];
  automations: AutomationSetting[];
  settings: Record<string, any>;
}

// Initial 3 Example Clients
function getInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // Client 1: Lead / Contacted
  const client1: Client = {
    id: "c-ex-1",
    name: "Sunrise Dental Clinic",
    owner_name: "Dr. Vikram Mehta",
    phone: "+91 98200 45678",
    email: "vikram@sunrisedental.in",
    city: "Mumbai",
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
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
      l2: { key: "l2", done: true, done_at: yesterday, done_by: "automation" },
      l3: { key: "l3", done: true, done_at: yesterday, done_by: "user" },
      c1: { key: "c1", done: true, done_at: yesterday, done_by: "automation" },
      c2: { key: "c2", done: false, done_by: "user" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  // Client 2: Won / Building stage
  const client2: Client = {
    id: "c-ex-2",
    name: "Dr. Batra Skin & Hair Care",
    owner_name: "Dr. Rohini Batra",
    phone: "+91 99301 88221",
    email: "dr.rohini@batraskin.com",
    city: "Bengaluru",
    niche: "Skin & hair clinic",
    package: "pro",
    founding_offer: true,
    notes: "50 real questions ingested. Running AI automated simulation test suite.",
    next_step: "Review AI test report with doctor",
    next_step_date: nextWeek,
    status: "active",
    portal_token: "tok_batra_skin_419",
    consent_at: yesterday,
    source: "referral",
    is_example: true,
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
      l2: { key: "l2", done: true, done_at: yesterday, done_by: "automation" },
      l3: { key: "l3", done: true, done_at: yesterday, done_by: "user" },
      c1: { key: "c1", done: true, done_at: yesterday, done_by: "automation" },
      c2: { key: "c2", done: true, done_at: yesterday, done_by: "automation" },
      b1: { key: "b1", done: true, done_at: yesterday, done_by: "automation" },
      b2: { key: "b2", done: true, done_at: yesterday, done_by: "automation" },
      b3: { key: "b3", done: true, done_at: yesterday, done_by: "automation" },
      m1: { key: "m1", done: true, done_at: yesterday, done_by: "user" },
      m2: { key: "m2", done: true, done_at: yesterday, done_by: "user" },
      m3: { key: "m3", done: true, done_at: yesterday, done_by: "user" },
      m4: { key: "m4", done: true, done_at: yesterday, done_by: "user" },
      p1: { key: "p1", done: true, done_at: yesterday, done_by: "automation" },
      p2: { key: "p2", done: true, done_at: yesterday, done_by: "automation" },
      w1: { key: "w1", done: true, done_at: yesterday, done_by: "automation" },
      w2: { key: "w2", done: true, done_at: yesterday, done_by: "automation" },
      w3: { key: "w3", done: true, done_at: yesterday, done_by: "automation" },
      d1: { key: "d1", done: true, done_at: yesterday, done_by: "automation" },
      d2: { key: "d2", done: false, done_by: "automation" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  // Client 3: Completed / Paid stage
  const client3: Client = {
    id: "c-ex-3",
    name: "Nova Diagnostics & Imaging",
    owner_name: "Amitabh Sen",
    phone: "+91 97110 33412",
    email: "operations@novadiagnostics.in",
    city: "Delhi NCR",
    niche: "Diagnostic lab",
    package: "growth",
    founding_offer: false,
    notes: "Live for 3 weeks on WhatsApp & PBX. Over 800 blood test appointments booked.",
    next_step: "Review weekly transcript report",
    next_step_date: nextWeek,
    status: "completed",
    portal_token: "tok_nova_diag_991",
    consent_at: yesterday,
    source: "website_demo_form",
    is_example: true,
    checks: {
      l1: { key: "l1", done: true, done_at: yesterday, done_by: "automation" },
      l2: { key: "l2", done: true, done_at: yesterday, done_by: "automation" },
      l3: { key: "l3", done: true, done_at: yesterday, done_by: "user" },
      c1: { key: "c1", done: true, done_at: yesterday, done_by: "automation" },
      c2: { key: "c2", done: true, done_at: yesterday, done_by: "automation" },
      b1: { key: "b1", done: true, done_at: yesterday, done_by: "automation" },
      b2: { key: "b2", done: true, done_at: yesterday, done_by: "automation" },
      b3: { key: "b3", done: true, done_at: yesterday, done_by: "automation" },
      m1: { key: "m1", done: true, done_at: yesterday, done_by: "user" },
      m2: { key: "m2", done: true, done_at: yesterday, done_by: "user" },
      m3: { key: "m3", done: true, done_at: yesterday, done_by: "user" },
      m4: { key: "m4", done: true, done_at: yesterday, done_by: "user" },
      p1: { key: "p1", done: true, done_at: yesterday, done_by: "automation" },
      p2: { key: "p2", done: true, done_at: yesterday, done_by: "automation" },
      w1: { key: "w1", done: true, done_at: yesterday, done_by: "automation" },
      w2: { key: "w2", done: true, done_at: yesterday, done_by: "automation" },
      w3: { key: "w3", done: true, done_at: yesterday, done_by: "automation" },
      d1: { key: "d1", done: true, done_at: yesterday, done_by: "automation" },
      d2: { key: "d2", done: true, done_at: yesterday, done_by: "automation" },
      d3: { key: "d3", done: true, done_at: yesterday, done_by: "automation" },
      v1: { key: "v1", done: true, done_at: yesterday, done_by: "user" },
      v2: { key: "v2", done: true, done_at: yesterday, done_by: "user" },
      v3: { key: "v3", done: true, done_at: yesterday, done_by: "automation" },
      f1: { key: "f1", done: true, done_at: yesterday, done_by: "automation" },
      q1: { key: "q1", done: true, done_at: yesterday, done_by: "automation" },
      q2: { key: "q2", done: true, done_at: yesterday, done_by: "automation" },
    },
    created_at: yesterday,
    updated_at: now,
  };

  const bill1 = calculateBill("growth", false);
  const bill2 = calculateBill("pro", true);
  const bill3 = calculateBill("growth", false);

  const proposals: Proposal[] = [
    {
      id: "prop-1",
      client_id: "c-ex-1",
      version: 1,
      package_id: "growth",
      setup_paise: rupeesToPaise(bill1.setup),
      monthly_paise: rupeesToPaise(bill1.monthly),
      gst_paise: rupeesToPaise(bill1.gst),
      total_first_bill_paise: rupeesToPaise(bill1.totalFirstBill),
      advance_paise: rupeesToPaise(bill1.advance),
      scope_bullets: [
        "AI Receptionist answering in Hindi & English",
        "WhatsApp booking agent 24×7",
        "Google Calendar slot integration",
      ],
      status: "draft",
      created_at: yesterday,
      updated_at: now,
    },
    {
      id: "prop-2",
      client_id: "c-ex-2",
      version: 1,
      package_id: "pro",
      setup_paise: rupeesToPaise(bill2.setup),
      monthly_paise: rupeesToPaise(bill2.monthly),
      gst_paise: rupeesToPaise(bill2.gst),
      total_first_bill_paise: rupeesToPaise(bill2.totalFirstBill),
      advance_paise: rupeesToPaise(bill2.advance),
      scope_bullets: [
        "Multi-doctor queue routing",
        "Skin analysis intake forms on WhatsApp",
        "Founding 50% setup discount applied",
      ],
      status: "accepted",
      accepted_at: yesterday,
      accepted_name: "Dr. Rohini Batra",
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv-2-adv",
      client_id: "c-ex-2",
      invoice_number: "AW/2026-27/0001",
      type: "advance",
      subtotal_paise: rupeesToPaise(bill2.setup * 0.5),
      gst_paise: rupeesToPaise(bill2.setup * 0.5 * 0.18),
      total_paise: rupeesToPaise(bill2.advance),
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_link_id: "plink_mock_adv_441",
      razorpay_payment_url: "https://rzp.io/i/mock_adv_441",
      pdf_url: "/api/invoices/inv-2-adv/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-adv",
      client_id: "c-ex-3",
      invoice_number: "AW/2026-27/0002",
      type: "advance",
      subtotal_paise: rupeesToPaise(bill3.setup * 0.5),
      gst_paise: rupeesToPaise(bill3.setup * 0.5 * 0.18),
      total_paise: rupeesToPaise(bill3.advance),
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_adv_442",
      pdf_url: "/api/invoices/inv-3-adv/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
    {
      id: "inv-3-fin",
      client_id: "c-ex-3",
      invoice_number: "AW/2026-27/0003",
      type: "final",
      subtotal_paise: rupeesToPaise(bill3.setup * 0.5 + bill3.monthly),
      gst_paise: rupeesToPaise((bill3.setup * 0.5 + bill3.monthly) * 0.18),
      total_paise: rupeesToPaise(bill3.finalBill),
      status: "paid",
      due_date: yesterday.slice(0, 10),
      paid_at: yesterday,
      razorpay_payment_url: "https://rzp.io/i/mock_fin_443",
      pdf_url: "/api/invoices/inv-3-fin/pdf",
      created_at: yesterday,
      updated_at: yesterday,
    },
  ];

  const automations: AutomationSetting[] = [
    { id: "A1", name: "New lead from website form", description: "Creates client, ticks l1 & l2, runs AI pain summary, notifies founder", enabled: true, success_count: 14, failure_count: 0 },
    { id: "A2", name: "Welcome message", description: "Within 2 min sends WhatsApp template with demo number and booking link → ticks c1", enabled: true, success_count: 14, failure_count: 0 },
    { id: "A3", name: "Reply detection", description: "Inbound WhatsApp webhook ticks c2 and logs to messages tab", enabled: true, success_count: 11, failure_count: 0 },
    { id: "A4", name: "Lead nurture", description: "Follow-ups at 24h & 72h; marks cold if 3 messages unresponded", enabled: true, success_count: 9, failure_count: 0 },
    { id: "A5", name: "Meeting booked", description: "Cal.com webhook ticks b1, schedules Meet URL, sets next step date", enabled: true, success_count: 7, failure_count: 0 },
    { id: "A6", name: "Demo agent prep", description: "Clones demo agent for client niche & personalises with business name → ticks b2", enabled: true, success_count: 7, failure_count: 0 },
    { id: "A7", name: "Meeting reminders", description: "WhatsApp reminders 24h and 1h before meeting → ticks b3", enabled: true, success_count: 6, failure_count: 0 },
    { id: "A8", name: "Proposal follow-up", description: "Nudge after 48h and 5d if proposal unaccepted → ticks p2", enabled: true, success_count: 5, failure_count: 0 },
    { id: "A9", name: "Accept and advance", description: "Portal accept ticks w1 → creates Razorpay link → on payment ticks w2", enabled: true, success_count: 4, failure_count: 0 },
    { id: "A10", name: "Onboarding collection", description: "Sends onboarding form link after advance → on submission ticks w3", enabled: true, success_count: 4, failure_count: 0 },
    { id: "A11", name: "Agent build draft", description: "AI generates system prompt & knowledge base from onboarding answers → ticks d1", enabled: true, success_count: 4, failure_count: 0 },
    { id: "A12", name: "Automated testing", description: "Generates 50 questions, grades answers, checks ≥90% pass rate → ticks d2", enabled: true, success_count: 3, failure_count: 0 },
    { id: "A13", name: "Client test approval", description: "Sends test phone link, client approves in portal → ticks d3", enabled: true, success_count: 3, failure_count: 0 },
    { id: "A14", name: "Final bill", description: "When v1 & v2 ticked, generates GST invoice for final bill → ticks f1", enabled: true, success_count: 2, failure_count: 0 },
    { id: "A15", name: "Payment received", description: "Razorpay webhook on final bill → ticks q1 → starts monthly subscription", enabled: true, success_count: 2, failure_count: 0 },
    { id: "A16", name: "Review request", description: "3 days after final payment sends Google review request → ticks q2", enabled: true, success_count: 2, failure_count: 0 },
    { id: "A17", name: "Weekly transcript review", description: "Monday AI review of volume, bookings & missed queries → ticks v3 on 1st run", enabled: true, success_count: 2, failure_count: 0 },
    { id: "A18", name: "Monthly client report", description: "1st of month emails PDF report of calls, bookings, hours saved", enabled: true, success_count: 2, failure_count: 0 },
    { id: "A19", name: "Monthly invoices & dunning", description: "Retainer invoices + reminders at +3, +7 and +14 days", enabled: true, success_count: 1, failure_count: 0 },
    { id: "A20", name: "Founder daily digest", description: "9:00 AM IST WhatsApp summary of meetings, overdue steps, revenue", enabled: true, success_count: 14, failure_count: 0 },
  ];

  const activity_log: ActivityLogRecord[] = [
    { id: "log-1", client_id: "c-ex-3", actor: "automation", action: "Final payment confirmed", detail: "Razorpay webhook paid final invoice AW/2026-27/0003. Ticked q1.", created_at: yesterday },
    { id: "log-2", client_id: "c-ex-2", actor: "automation", action: "Advance payment received", detail: "Advance ₹20,650 paid. Onboarding link sent to Dr. Rohini. Ticked w2.", created_at: yesterday },
    { id: "log-3", client_id: "c-ex-2", actor: "client", action: "Proposal accepted", detail: "Dr. Rohini Batra accepted Pro Proposal v1 via Client Portal. Ticked w1.", created_at: yesterday },
    { id: "log-4", client_id: "c-ex-1", actor: "automation", action: "Lead created", detail: "Submitted demo form from landing page. AI extracted pain points. Ticked l1, l2.", created_at: yesterday },
    { id: "log-5", client_id: "c-ex-1", actor: "automation", action: "Welcome WhatsApp sent", detail: `Template sent with demo number ${DEMO_NUMBER}. Ticked c1.`, created_at: yesterday },
  ];

  return {
    clients: [client1, client2, client3],
    invoices,
    proposals,
    messages: [
      { id: "msg-1", client_id: "c-ex-1", direction: "outbound", channel: "whatsapp", body: `Hello Dr. Vikram! Welcome to AgentWala. Test our demo receptionist at ${DEMO_NUMBER} or pick a 20-min slot.`, status: "delivered", created_at: yesterday },
      { id: "msg-2", client_id: "c-ex-2", direction: "outbound", channel: "whatsapp", body: "Your customized AI receptionist build is underway. Here is your test phone line.", status: "delivered", created_at: yesterday },
    ],
    agents: [
      {
        id: "ag-2",
        client_id: "c-ex-2",
        niche: "Skin & hair clinic",
        prompt: "You are the AI receptionist for Dr. Batra Skin & Hair Care. Be polite, warm, and helpful in Hindi and English.",
        knowledge_base: "Timings: Mon-Sat 10 AM - 8 PM. Doctor consultation: ₹800. Location: Indiranagar 100ft road.",
        status: "testing",
        created_at: yesterday,
        updated_at: now,
      }
    ],
    jobs: [],
    activity_log,
    automations,
    settings: {
      ...SITE_CONFIG,
      razorpay_status: "mock",
      whatsapp_status: "mock",
      email_status: "mock",
      cal_status: "mock",
      ai_status: "mock",
    },
  };
}

function ensureDataFile(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    const initial = getInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

function writeData(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

export const db = {
  // CLIENTS
  async getClients(): Promise<Client[]> {
    const data = ensureDataFile();
    return data.clients;
  },

  async getClientById(id: string): Promise<Client | null> {
    const data = ensureDataFile();
    return data.clients.find((c) => c.id === id) || null;
  },

  async getClientByToken(token: string): Promise<Client | null> {
    const data = ensureDataFile();
    return data.clients.find((c) => c.portal_token === token) || null;
  },

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const data = ensureDataFile();
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
      niche: clientData.niche || "Local business",
      package: clientData.package || "growth",
      founding_offer: Boolean(clientData.founding_offer),
      notes: clientData.notes || "",
      next_step: clientData.next_step || "",
      next_step_date: clientData.next_step_date || "",
      status: "active",
      portal_token: token,
      consent_at: clientData.consent_at || now,
      source: clientData.source || "website_demo_form",
      checks: clientData.checks || {},
      created_at: now,
      updated_at: now,
    };

    data.clients.unshift(newClient);
    writeData(data);

    await this.logActivity(
      "automation",
      "Lead Created",
      `New lead registered for ${newClient.name} (${newClient.phone})`,
      newClient.id
    );

    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const data = ensureDataFile();
    const index = data.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    data.clients[index] = {
      ...data.clients[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeData(data);
    return data.clients[index];
  },

  async deleteClient(id: string): Promise<boolean> {
    const data = ensureDataFile();
    const initialLen = data.clients.length;
    data.clients = data.clients.filter((c) => c.id !== id);
    if (data.clients.length !== initialLen) {
      writeData(data);
      await this.logActivity("user", "Client Removed", `Client ${id} was deleted`, id);
      return true;
    }
    return false;
  },

  async updateCheck(
    clientId: string,
    key: StageKey,
    done: boolean,
    doneBy: "user" | "automation" | "client" = "user"
  ): Promise<Client | null> {
    const data = ensureDataFile();
    const client = data.clients.find((c) => c.id === clientId);
    if (!client) return null;

    if (!client.checks) client.checks = {};
    client.checks[key] = {
      key,
      done,
      done_at: done ? new Date().toISOString() : undefined,
      done_by: doneBy,
    };
    client.updated_at = new Date().toISOString();

    writeData(data);

    await this.logActivity(
      doneBy,
      `Checklist ${key} ${done ? "completed" : "unmarked"}`,
      `${doneBy === "automation" ? "Automation" : "User"} marked ${key} as ${done ? "done" : "incomplete"} for ${client.name}`,
      client.id
    );

    return client;
  },

  // INVOICES
  async getInvoices(): Promise<Invoice[]> {
    const data = ensureDataFile();
    return data.invoices;
  },

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    const data = ensureDataFile();
    return data.invoices.filter((i) => i.client_id === clientId);
  },

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const data = ensureDataFile();
    const id = "inv-" + Date.now().toString(36);
    const invoiceNumber = `AW/2026-27/${String(data.invoices.length + 1).padStart(4, "0")}`;
    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      id,
      client_id: invoiceData.client_id || "",
      invoice_number: invoiceData.invoice_number || invoiceNumber,
      type: invoiceData.type || "advance",
      subtotal_paise: invoiceData.subtotal_paise || 0,
      gst_paise: invoiceData.gst_paise || 0,
      total_paise: invoiceData.total_paise || 0,
      status: invoiceData.status || "draft",
      due_date: invoiceData.due_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      razorpay_payment_url: invoiceData.razorpay_payment_url,
      pdf_url: `/api/invoices/${id}/pdf`,
      created_at: now,
      updated_at: now,
    };

    data.invoices.unshift(newInvoice);
    writeData(data);

    await this.logActivity(
      "automation",
      "Invoice Generated",
      `Invoice ${newInvoice.invoice_number} generated for ${newInvoice.total_paise / 100} INR`,
      newInvoice.client_id
    );

    return newInvoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const data = ensureDataFile();
    const index = data.invoices.findIndex((i) => i.id === id);
    if (index === -1) return null;

    data.invoices[index] = {
      ...data.invoices[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeData(data);
    return data.invoices[index];
  },

  // PROPOSALS
  async getProposals(): Promise<Proposal[]> {
    const data = ensureDataFile();
    return data.proposals;
  },

  async getProposalByClientId(clientId: string): Promise<Proposal | null> {
    const data = ensureDataFile();
    return data.proposals.find((p) => p.client_id === clientId) || null;
  },

  async createProposal(proposalData: Partial<Proposal>): Promise<Proposal> {
    const data = ensureDataFile();
    const id = "prop-" + Date.now().toString(36);
    const now = new Date().toISOString();

    const newProposal: Proposal = {
      id,
      client_id: proposalData.client_id || "",
      version: proposalData.version || 1,
      package_id: proposalData.package_id || "growth",
      setup_paise: proposalData.setup_paise || 0,
      monthly_paise: proposalData.monthly_paise || 0,
      gst_paise: proposalData.gst_paise || 0,
      total_first_bill_paise: proposalData.total_first_bill_paise || 0,
      advance_paise: proposalData.advance_paise || 0,
      scope_bullets: proposalData.scope_bullets || [],
      pdf_url: `/api/proposals/${id}/pdf`,
      status: proposalData.status || "draft",
      created_at: now,
      updated_at: now,
    };

    data.proposals.unshift(newProposal);
    writeData(data);
    return newProposal;
  },

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal | null> {
    const data = ensureDataFile();
    const index = data.proposals.findIndex((p) => p.id === id);
    if (index === -1) return null;

    data.proposals[index] = {
      ...data.proposals[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeData(data);
    return data.proposals[index];
  },

  // MESSAGES
  async getMessages(clientId?: string): Promise<MessageRecord[]> {
    const data = ensureDataFile();
    if (clientId) {
      return data.messages.filter((m) => m.client_id === clientId);
    }
    return data.messages;
  },

  async createMessage(msg: Partial<MessageRecord>): Promise<MessageRecord> {
    const data = ensureDataFile();
    const id = "msg-" + Date.now().toString(36);
    const newMsg: MessageRecord = {
      id,
      client_id: msg.client_id || "",
      direction: msg.direction || "outbound",
      channel: msg.channel || "whatsapp",
      template: msg.template,
      body: msg.body || "",
      status: msg.status || "sent",
      created_at: new Date().toISOString(),
    };

    data.messages.unshift(newMsg);
    writeData(data);
    return newMsg;
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 30, clientId?: string): Promise<ActivityLogRecord[]> {
    const data = ensureDataFile();
    let logs = data.activity_log;
    if (clientId) {
      logs = logs.filter((l) => l.client_id === clientId);
    }
    return logs.slice(0, limit);
  },

  async logActivity(
    actor: "user" | "automation" | "client" | "system",
    action: string,
    detail: string,
    clientId?: string
  ): Promise<ActivityLogRecord> {
    const data = ensureDataFile();
    const newLog: ActivityLogRecord = {
      id: "log-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      client_id: clientId,
      actor,
      action,
      detail,
      created_at: new Date().toISOString(),
    };
    data.activity_log.unshift(newLog);
    writeData(data);
    return newLog;
  },

  // AUTOMATIONS
  async getAutomations(): Promise<AutomationSetting[]> {
    const data = ensureDataFile();
    return data.automations;
  },

  async toggleAutomation(id: string, enabled: boolean): Promise<AutomationSetting | null> {
    const data = ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (!auto) return null;
    auto.enabled = enabled;
    writeData(data);
    await this.logActivity("user", "Automation Toggled", `Automation ${id} set to ${enabled ? "enabled" : "disabled"}`);
    return auto;
  },

  async recordAutomationRun(id: string, success: boolean): Promise<void> {
    const data = ensureDataFile();
    const auto = data.automations.find((a) => a.id === id);
    if (auto) {
      auto.last_run = new Date().toISOString();
      if (success) auto.success_count += 1;
      else auto.failure_count += 1;
      writeData(data);
    }
  },

  // SETTINGS
  async getSettings(): Promise<Record<string, any>> {
    const data = ensureDataFile();
    return data.settings;
  },

  async updateSettings(updates: Record<string, any>): Promise<Record<string, any>> {
    const data = ensureDataFile();
    data.settings = { ...data.settings, ...updates };
    writeData(data);
    await this.logActivity("user", "Settings Updated", "Business settings updated");
    return data.settings;
  },
};
