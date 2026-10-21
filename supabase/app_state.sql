-- AgentWala App State Storage Table for Vercel Serverless
-- Stores document-style JSON blobs (e.g. key = 'db', key = 'clock')

create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  version bigint not null default 0,
  updated_at timestamptz default now()
);

-- Idempotent column addition for existing tables
alter table public.app_state add column if not exists version bigint not null default 0;

-- Enable Row Level Security (RLS)
alter table public.app_state enable row level security;

-- With RLS enabled and no public policies created, standard anon/authenticated users
-- have zero read/write access. Only the Supabase service role key (bypassing RLS) can read and write.

-- Stored procedure for atomic optimistic concurrency control
-- Updates only when version = p_expected_version, increments version, and returns new version (or null on conflict).
-- Inserts the row starting with version 1 if it does not exist.
create or replace function public.save_app_state(
  p_key text,
  p_data jsonb,
  p_expected_version bigint default null
)
returns bigint
language plpgsql
security definer
as $$
declare
  v_new_version bigint;
  v_current_version bigint;
begin
  select version into v_current_version from public.app_state where key = p_key for update;
  
  if not found then
    insert into public.app_state (key, data, version, updated_at)
    values (p_key, p_data, 1, now())
    returning version into v_new_version;
    return v_new_version;
  end if;

  -- Optimistic concurrency check
  if p_expected_version is not null and v_current_version != p_expected_version then
    return null; -- Version conflict
  end if;

  -- Update with version increment
  update public.app_state
  set data = p_data,
      version = v_current_version + 1,
      updated_at = now()
  where key = p_key
  returning version into v_new_version;

  return v_new_version;
end;
$$;

-- Lock down the function: only the server (service_role) can call it
alter function public.save_app_state(text, jsonb, bigint) set search_path = public;
revoke all on function public.save_app_state(text, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.save_app_state(text, jsonb, bigint) to service_role;

-- Belt and braces: block direct table access too
revoke all on table public.app_state from anon, authenticated;

