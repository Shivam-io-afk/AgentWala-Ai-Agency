-- AgentWala App State Storage Table for Vercel Serverless
-- Stores document-style JSON blobs (e.g. key = 'db', key = 'clock')

create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.app_state enable row level security;

-- With RLS enabled and no public policies created, standard anon/authenticated users
-- have zero read/write access. Only the Supabase service role key (bypassing RLS) can read and write.
