-- ==============================================================================
-- AGENTWALA PRODUCTION SUPABASE SCHEMA (v2)
-- Supports PostgreSQL, Row Level Security (RLS), multi-projects, agreements,
-- revisions, time logs, usage costs, and GST on/off switch.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'Bengaluru',
    state TEXT DEFAULT 'Karnataka',
    niche TEXT NOT NULL DEFAULT 'Local business',
    package TEXT NOT NULL DEFAULT 'growth',
    founding_offer BOOLEAN DEFAULT FALSE,
    notes TEXT,
    next_step TEXT,
    next_step_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cold', 'lost', 'completed')),
    portal_token TEXT UNIQUE NOT NULL,
    consent_at TIMESTAMPTZ,
    source TEXT DEFAULT 'website_enquiry_form',
    is_example BOOLEAN DEFAULT FALSE,
    paused_follow_ups_until TIMESTAMPTZ,
    outbound_count INTEGER DEFAULT 0,
    last_inbound_at TIMESTAMPTZ,
    ai_confidence_score FLOAT DEFAULT 1.0,
    qualifying_answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 2. Projects Table (v2 Multi-Project Pipeline)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('ai_agent', 'website', 'app', 'ecommerce', 'creator')),
    package_id TEXT NOT NULL,
    price_paise BIGINT NOT NULL,
    monthly_paise BIGINT DEFAULT 0,
    founding_offer BOOLEAN DEFAULT FALSE,
    milestone_plan TEXT NOT NULL DEFAULT '50_50' CHECK (milestone_plan IN ('50_50', '40_30_30')),
    revision_rounds_included INTEGER DEFAULT 2,
    revisions_used INTEGER DEFAULT 0,
    portal_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cold', 'lost', 'completed')),
    next_step TEXT,
    next_step_date DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 3. Project Checklist Checks Table (27 keys in v2)
CREATE TABLE IF NOT EXISTS public.project_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    done_at TIMESTAMPTZ,
    done_by TEXT NOT NULL CHECK (done_by IN ('user', 'automation', 'client')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    UNIQUE(project_id, key)
);

-- 4. Requirements Table (H1)
CREATE TABLE IF NOT EXISTS public.requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    features JSONB DEFAULT '[]'::jsonb,
    pages_screens JSONB DEFAULT '[]'::jsonb,
    integrations JSONB DEFAULT '[]'::jsonb,
    content_owner TEXT,
    deadline DATE,
    budget_paise BIGINT,
    recorded_consent BOOLEAN DEFAULT FALSE,
    raw_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    UNIQUE(project_id)
);

-- 5. Scopes Table (Annex A)
CREATE TABLE IF NOT EXISTS public.scopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    goal TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    platforms JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '["English", "Hindi"]'::jsonb,
    limits JSONB DEFAULT '["2 revision rounds included"]'::jsonb,
    not_included JSONB DEFAULT '[]'::jsonb,
    client_provides JSONB DEFAULT '[]'::jsonb,
    timeline_first_demo DATE,
    timeline_handover DATE,
    project_fee_paise BIGINT NOT NULL,
    monthly_fee_paise BIGINT DEFAULT 0,
    advance_paise BIGINT NOT NULL,
    milestone_paise BIGINT DEFAULT 0,
    final_paise BIGINT NOT NULL,
    care_plan_paise BIGINT DEFAULT 0,
    approved_by_founder BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 6. Agreements Table (Section 8)
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted')),
    pdf_url TEXT,
    document_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 7. Agreement Acceptances Table (OTP Audit Record)
CREATE TABLE IF NOT EXISTS public.agreement_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    typed_name TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    otp_verified BOOLEAN DEFAULT FALSE,
    otp_verified_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    document_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 8. Tasks Table (/admin/work)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('build', 'revision', 'change_request', 'handover')),
    hours_estimated FLOAT DEFAULT 1.0,
    due_date DATE,
    done BOOLEAN DEFAULT FALSE,
    done_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 9. Time Logs Table
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    hours FLOAT NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hourly_rate_paise BIGINT DEFAULT 100000,
    is_change_request BOOLEAN DEFAULT FALSE,
    change_request_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 10. Deliveries Table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('staging_link', 'test_number', 'demo_build', 'final_build')),
    url_or_number TEXT NOT NULL,
    notes TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    review_deadline TIMESTAMPTZ NOT NULL,
    deemed_accepted_at TIMESTAMPTZ
);

-- 11. Revision Rounds Table (Section 7)
CREATE TABLE IF NOT EXISTS public.revision_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'in_progress', 'closed', 'deemed_accepted')),
    submitted_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 12. Revision Items Table
CREATE TABLE IF NOT EXISTS public.revision_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.revision_rounds(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    ai_label TEXT NOT NULL CHECK (ai_label IN ('revision', 'new_feature')),
    ai_reason TEXT,
    founder_confirmed BOOLEAN DEFAULT FALSE,
    is_change_request BOOLEAN DEFAULT FALSE,
    change_request_id TEXT
);

-- 13. Change Requests Table
CREATE TABLE IF NOT EXISTS public.change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    hours_quoted FLOAT NOT NULL,
    amount_paise BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'quoted', 'approved', 'paid', 'completed')),
    invoice_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 14. Handovers Table (Annex B)
CREATE TABLE IF NOT EXISTS public.handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    invoice_paid BOOLEAN DEFAULT FALSE,
    domain_transferred BOOLEAN DEFAULT FALSE,
    source_code_transferred BOOLEAN DEFAULT FALSE,
    repository_url TEXT,
    credentials_link TEXT,
    credentials_expiry TIMESTAMPTZ,
    agent_exported BOOLEAN DEFAULT FALSE,
    documentation_url TEXT,
    walkthrough_video_url TEXT,
    warranty_start_date DATE,
    warranty_end_date DATE,
    care_plan_active BOOLEAN DEFAULT FALSE,
    client_confirmed BOOLEAN DEFAULT FALSE,
    client_confirmed_at TIMESTAMPTZ,
    completion_cert_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 15. Invoices Table (GST Switch & Milestones)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('advance', 'milestone', 'final', 'change', 'monthly', 'care')),
    subtotal_paise BIGINT NOT NULL,
    is_gst BOOLEAN DEFAULT FALSE,
    cgst_paise BIGINT DEFAULT 0,
    sgst_paise BIGINT DEFAULT 0,
    igst_paise BIGINT DEFAULT 0,
    total_paise BIGINT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    razorpay_payment_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 16. Usage Costs Table (Spending Caps)
CREATE TABLE IF NOT EXISTS public.usage_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service TEXT NOT NULL CHECK (service IN ('ai', 'voice', 'whatsapp', 'email')),
    model_or_channel TEXT NOT NULL,
    units BIGINT NOT NULL,
    cost_paise BIGINT NOT NULL,
    job_id TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 17. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    template TEXT,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'received', 'failed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 18. Jobs Table (Queue with Idempotency)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key TEXT UNIQUE,
    type TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    payload JSONB,
    run_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    level INTEGER DEFAULT 1 CHECK (level IN (1, 2, 3)),
    shadow_mode BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 19. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    actor TEXT NOT NULL CHECK (actor IN ('user', 'automation', 'client', 'system')),
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    trigger_event TEXT,
    ai_input TEXT,
    ai_output TEXT,
    confidence_score FLOAT DEFAULT 1.0,
    shadow BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 20. Recommendations Table (Section 7b AI Copilot)
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_name TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    why_rule TEXT,
    action_label TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'navigate',
    action_payload JSONB,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    money_at_risk_rupees BIGINT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'snoozed', 'dismissed', 'acted')),
    snoozed_until TIMESTAMPTZ,
    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 21. Row Level Security (RLS) Setup
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Founder full access policy
CREATE POLICY founder_full_access_clients ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY founder_full_access_projects ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY founder_full_access_invoices ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Portal token isolation policy
CREATE POLICY portal_token_read_project ON public.projects FOR SELECT TO anon USING (
    portal_token = current_setting('request.headers', true)::json->>'x-portal-token'
);
CREATE POLICY portal_token_read_invoices ON public.invoices FOR SELECT TO anon USING (
    project_id IN (
        SELECT id FROM public.projects WHERE portal_token = current_setting('request.headers', true)::json->>'x-portal-token'
    )
);
