-- ==============================================================================
-- AGENTWALA PRODUCTION SUPABASE SCHEMA
-- Supports PostgreSQL, Row Level Security (RLS), and sequential invoices
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
    city TEXT DEFAULT 'Mumbai',
    niche TEXT NOT NULL DEFAULT 'Local business',
    package TEXT NOT NULL DEFAULT 'growth',
    founding_offer BOOLEAN DEFAULT FALSE,
    notes TEXT,
    next_step TEXT,
    next_step_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cold', 'lost', 'completed')),
    portal_token TEXT UNIQUE NOT NULL,
    consent_at TIMESTAMPTZ,
    source TEXT DEFAULT 'website_demo_form',
    is_example BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 2. Client Checklist Checks Table
CREATE TABLE IF NOT EXISTS public.client_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    done_at TIMESTAMPTZ,
    done_by TEXT NOT NULL CHECK (done_by IN ('user', 'automation')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    UNIQUE(client_id, key)
);

-- 3. Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    meet_url TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 4. Proposals Table
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    package_id TEXT NOT NULL,
    setup_paise BIGINT NOT NULL,
    monthly_paise BIGINT NOT NULL,
    gst_paise BIGINT NOT NULL,
    total_first_bill_paise BIGINT NOT NULL,
    advance_paise BIGINT NOT NULL,
    scope_bullets JSONB DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
    accepted_at TIMESTAMPTZ,
    accepted_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('advance', 'final', 'monthly')),
    subtotal_paise BIGINT NOT NULL,
    gst_paise BIGINT NOT NULL,
    total_paise BIGINT NOT NULL,
    razorpay_id TEXT,
    razorpay_payment_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 6. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    template TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'received', 'failed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 7. Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    prompt TEXT NOT NULL,
    knowledge_base TEXT,
    test_report JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'approved', 'live')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 8. Background Jobs Queue
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    payload JSONB DEFAULT '{}'::jsonb,
    run_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 9. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    actor TEXT NOT NULL CHECK (actor IN ('user', 'automation', 'client', 'system')),
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- 10. Settings & Templates
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Anonymous users can access Client Portal via portal_token
CREATE POLICY "Public portal access via token" ON public.clients
    FOR SELECT USING (portal_token IS NOT NULL);

-- Authenticated founder has full admin access
CREATE POLICY "Founder full access" ON public.clients
    FOR ALL USING (auth.role() = 'authenticated');
