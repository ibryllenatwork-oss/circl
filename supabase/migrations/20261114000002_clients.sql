-- Clients, their contacts and documents, and VA assignments.
-- Access model: RLS on with NO policies. Only the server (service role) reads/writes.

-- ------------------------------------------------------------------ clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (btrim(company_name) <> ''),
  industry text,
  website text,
  country text,
  timezone text,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'paused', 'ended')),
  start_date date,

  billing_email text,
  billing_address text,
  currency text not null default 'USD' check (currency in ('USD', 'AUD', 'CAD', 'GBP', 'EUR', 'NZD', 'SGD', 'PHP')),
  rate numeric(12, 2) check (rate >= 0),
  rate_basis text check (rate_basis in ('hourly', 'monthly')),
  billing_cycle text check (billing_cycle in ('weekly', 'biweekly', 'monthly')),
  payment_method text,

  services text[] not null default '{}',
  hours_per_week numeric(5, 1) check (hours_per_week >= 0),
  contract_start date,
  contract_end date,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,

  constraint clients_contract_dates check (
    contract_end is null or contract_start is null or contract_end >= contract_start)
);

create unique index clients_company_name_key on public.clients (lower(company_name));
create index clients_status_idx on public.clients (status);
create index clients_created_by_idx on public.clients (created_by);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

-- ---------------------------------------------------------- client_contacts
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  position integer not null default 0
);

create index client_contacts_client_idx on public.client_contacts (client_id);
create unique index client_contacts_one_primary on public.client_contacts (client_id) where is_primary;
alter table public.client_contacts enable row level security;

-- --------------------------------------------------------- client_documents
create table public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  doc_type text not null check (doc_type in ('contract', 'nda', 'sow', 'other')),
  label text,
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes integer,
  expires_on date,
  created_at timestamptz not null default now(),
  created_by text
);

create index client_documents_client_idx on public.client_documents (client_id);
alter table public.client_documents enable row level security;

-- ------------------------------------------------------- client_assignments
create table public.client_assignments (
  client_id uuid not null references public.clients (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  assigned_on date not null default current_date,
  primary key (client_id, employee_id)
);

create index client_assignments_employee_idx on public.client_assignments (employee_id);
alter table public.client_assignments enable row level security;

-- --------------------------------------------------------------- save_client
-- Inserts or updates a client and replaces its contacts in one transaction.
-- p_client: client fields as JSON (with "id" for updates). p_contacts: array of
-- {name, role, email, phone, is_primary}. First contact becomes primary if none is.
create or replace function public.save_client(
  p_client jsonb,
  p_contacts jsonb,
  p_actor text
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_client ->> 'id', '')::uuid;
  v_has_primary boolean;
  v_contact jsonb;
  v_index integer := 0;
begin
  if jsonb_typeof(p_contacts) <> 'array' or jsonb_array_length(p_contacts) = 0 then
    raise exception 'at least one contact is required';
  end if;

  if v_id is null then
    insert into public.clients (
      company_name, industry, website, country, timezone, status, start_date,
      billing_email, billing_address, currency, rate, rate_basis, billing_cycle,
      payment_method, services, hours_per_week, contract_start, contract_end, notes,
      created_by, updated_by)
    select
      r.company_name, r.industry, r.website, r.country, r.timezone, coalesce(r.status, 'prospect'), r.start_date,
      r.billing_email, r.billing_address, coalesce(r.currency, 'USD'), r.rate, r.rate_basis, r.billing_cycle,
      r.payment_method, coalesce(r.services, '{}'), r.hours_per_week, r.contract_start, r.contract_end, r.notes,
      p_actor, p_actor
    from jsonb_populate_record(null::public.clients, p_client) r
    returning id into v_id;
  else
    update public.clients c set
      company_name = r.company_name, industry = r.industry, website = r.website,
      country = r.country, timezone = r.timezone, status = coalesce(r.status, c.status),
      start_date = r.start_date, billing_email = r.billing_email, billing_address = r.billing_address,
      currency = coalesce(r.currency, c.currency), rate = r.rate, rate_basis = r.rate_basis,
      billing_cycle = r.billing_cycle, payment_method = r.payment_method,
      services = coalesce(r.services, '{}'), hours_per_week = r.hours_per_week,
      contract_start = r.contract_start, contract_end = r.contract_end, notes = r.notes,
      updated_by = p_actor
    from jsonb_populate_record(null::public.clients, p_client) r
    where c.id = v_id;
    if not found then
      raise exception 'client not found';
    end if;
    delete from public.client_contacts where client_id = v_id;
  end if;

  select bool_or(coalesce((c ->> 'is_primary')::boolean, false))
    into v_has_primary
    from jsonb_array_elements(p_contacts) c;

  for v_contact in select * from jsonb_array_elements(p_contacts) loop
    insert into public.client_contacts (client_id, name, role, email, phone, is_primary, position)
    values (
      v_id,
      v_contact ->> 'name',
      nullif(v_contact ->> 'role', ''),
      nullif(v_contact ->> 'email', ''),
      nullif(v_contact ->> 'phone', ''),
      case when v_has_primary then coalesce((v_contact ->> 'is_primary')::boolean, false)
           else v_index = 0 end,
      v_index);
    v_index := v_index + 1;
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.save_client(jsonb, jsonb, text) from public, anon, authenticated;
