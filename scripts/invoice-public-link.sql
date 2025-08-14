-- Invoice Public Link Support
-- Adds columns and a simple RLS policy for public invoice viewing by token.
-- NOTE: This policy allows selecting any invoice where public_enabled = true.
-- For stricter security, prefer an RPC that checks token equality server-side,
-- or a dedicated view exposing limited fields.

-- Columns for public links
alter table public.invoices add column if not exists public_token text unique;
alter table public.invoices add column if not exists public_enabled boolean not null default false;
alter table public.invoices add column if not exists public_expires_at timestamptz;

-- Optional: generate token on enable. Application can also set this explicitly.
-- update public.invoices set public_token = encode(gen_random_bytes(16), 'hex') where public_token is null;

-- RLS policy (ensure RLS is enabled on invoices)
-- This policy lets anon read only rows marked public_enabled = true.
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'invoices' and policyname = 'select_public_invoices'
  ) then
    create policy select_public_invoices
      on public.invoices
      for select
      to anon
      using (public_enabled = true);
  end if;
end $$;

-- Optional: index for faster public lookups by token
create index if not exists invoices_public_token_idx on public.invoices (public_token) where public_enabled = true;

