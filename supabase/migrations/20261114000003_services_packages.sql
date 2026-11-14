-- Services (one level of subservices), hourly rates per tier, and package templates.
-- Access model: RLS on with NO policies. Only the server (service role) reads/writes.

-- ------------------------------------------------------------------ services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.services (id) on delete restrict,
  name text not null check (btrim(name) <> '' and char_length(name) <= 120),
  description text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  constraint services_not_own_parent check (parent_id is null or parent_id <> id)
);

create unique index services_sibling_name_key
  on public.services (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index services_parent_idx on public.services (parent_id);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

-- ------------------------------------------------------------- service_rates
create table public.service_rates (
  service_id uuid not null references public.services (id) on delete cascade,
  tier text not null check (tier in ('entry', 'intermediate', 'expert')),
  client_rate numeric(10, 2) not null check (client_rate >= 0 and client_rate <= 10000),
  va_rate numeric(10, 2) not null check (va_rate >= 0 and va_rate <= 10000),
  updated_at timestamptz not null default now(),
  primary key (service_id, tier)
);

alter table public.service_rates enable row level security;

-- ------------------------------------------------------------------ packages
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> '' and char_length(name) <= 120),
  description text,
  monthly_amount numeric(12, 2) not null check (monthly_amount >= 0 and monthly_amount <= 1000000),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create unique index packages_name_key on public.packages (lower(name));

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

alter table public.packages enable row level security;

-- ------------------------------------------------------------- package_lines
create table public.package_lines (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  tier text not null check (tier in ('entry', 'intermediate', 'expert')),
  hours_per_month numeric(6, 1) not null check (hours_per_month > 0 and hours_per_month <= 744),
  position integer not null default 0,
  constraint package_lines_service_tier_key unique (package_id, service_id, tier)
);

create index package_lines_service_idx on public.package_lines (service_id);

alter table public.package_lines enable row level security;

-- ------------------------------------------------------- hierarchy integrity
-- One level only; a service with rates or package lines can't gain children;
-- a service with children can't be nested.
create or replace function public.services_check_hierarchy()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and exists (select 1 from public.services c where c.parent_id = new.id) then
    raise exception 'service_has_children: a service with subservices can''t become a subservice';
  end if;
  select p.parent_id into parent_parent from public.services p where p.id = new.parent_id;
  if not found then
    raise exception 'parent_not_found';
  end if;
  if parent_parent is not null then
    raise exception 'one_level_only: subservices can''t have subservices';
  end if;
  if exists (select 1 from public.service_rates r where r.service_id = new.parent_id) then
    raise exception 'parent_has_rates: remove this service''s rates before adding subservices';
  end if;
  if exists (select 1 from public.package_lines l where l.service_id = new.parent_id) then
    raise exception 'parent_in_packages: take this service out of packages before adding subservices';
  end if;
  return new;
end;
$$;

create trigger services_check_hierarchy
  before insert or update of parent_id on public.services
  for each row execute function public.services_check_hierarchy();

-- Rates and package lines may only reference priceable (childless) services.
create or replace function public.require_priceable_service()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.services c where c.parent_id = new.service_id) then
    raise exception 'not_priceable: this service has subservices; use a subservice instead';
  end if;
  return new;
end;
$$;

create trigger service_rates_priceable
  before insert or update of service_id on public.service_rates
  for each row execute function public.require_priceable_service();

create trigger package_lines_priceable
  before insert or update of service_id on public.package_lines
  for each row execute function public.require_priceable_service();

-- ------------------------------------------------------- save_service_rates
-- p_rates: [{tier, client_rate, va_rate}] — both null deletes that tier.
create or replace function public.save_service_rates(
  p_service_id uuid,
  p_rates jsonb,
  p_actor text
) returns void
language plpgsql
set search_path = ''
as $$
declare
  r jsonb;
  v_client numeric;
  v_va numeric;
begin
  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'service not found';
  end if;
  for r in select * from jsonb_array_elements(p_rates) loop
    v_client := nullif(r ->> 'client_rate', '')::numeric;
    v_va := nullif(r ->> 'va_rate', '')::numeric;
    if v_client is null and v_va is null then
      delete from public.service_rates where service_id = p_service_id and tier = r ->> 'tier';
    elsif v_client is null or v_va is null then
      raise exception 'rate_incomplete: enter both the client and VA rate for %', r ->> 'tier';
    else
      insert into public.service_rates (service_id, tier, client_rate, va_rate, updated_at)
      values (p_service_id, r ->> 'tier', v_client, v_va, now())
      on conflict (service_id, tier)
      do update set client_rate = excluded.client_rate, va_rate = excluded.va_rate, updated_at = now();
    end if;
  end loop;
  update public.services set updated_by = p_actor where id = p_service_id;
end;
$$;

revoke execute on function public.save_service_rates(uuid, jsonb, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- save_package
-- Inserts or updates a package and replaces its lines in one transaction.
create or replace function public.save_package(
  p_package jsonb,
  p_lines jsonb,
  p_actor text
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_package ->> 'id', '')::uuid;
  v_line jsonb;
  v_index integer := 0;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'at least one line is required';
  end if;

  if v_id is null then
    insert into public.packages (name, description, monthly_amount, active, notes, created_by, updated_by)
    values (
      p_package ->> 'name',
      nullif(p_package ->> 'description', ''),
      (p_package ->> 'monthly_amount')::numeric,
      coalesce((p_package ->> 'active')::boolean, true),
      nullif(p_package ->> 'notes', ''),
      p_actor, p_actor)
    returning id into v_id;
  else
    update public.packages set
      name = p_package ->> 'name',
      description = nullif(p_package ->> 'description', ''),
      monthly_amount = (p_package ->> 'monthly_amount')::numeric,
      active = coalesce((p_package ->> 'active')::boolean, active),
      notes = nullif(p_package ->> 'notes', ''),
      updated_by = p_actor
    where id = v_id;
    if not found then
      raise exception 'package not found';
    end if;
    delete from public.package_lines where package_id = v_id;
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.package_lines (package_id, service_id, tier, hours_per_month, position)
    values (
      v_id,
      (v_line ->> 'service_id')::uuid,
      v_line ->> 'tier',
      (v_line ->> 'hours_per_month')::numeric,
      v_index);
    v_index := v_index + 1;
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.save_package(jsonb, jsonb, text) from public, anon, authenticated;
