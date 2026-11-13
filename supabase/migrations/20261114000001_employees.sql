-- Employees (VA 201 file), their documents and past employment stints.
-- Access model: RLS on with NO policies. Only the server (service role) reads/writes.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- employees
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  seq integer generated always as identity unique,
  employee_no text generated always as ('CIRCL-' || lpad(seq::text, 4, '0')) stored unique,

  photo_path text,

  -- Personal
  first_name text not null check (btrim(first_name) <> ''),
  middle_name text,
  last_name text not null check (btrim(last_name) <> ''),
  suffix text,
  nickname text,
  birth_date date,
  sex text check (sex in ('male', 'female')),
  civil_status text check (civil_status in ('single', 'married', 'widowed', 'separated', 'annulled')),
  nationality text default 'Filipino',
  personal_email text not null,
  mobile text,
  current_address text,
  permanent_address text,

  -- Government IDs (formatted by the app)
  sss_no text,
  philhealth_no text,
  pagibig_no text,
  tin text,

  -- Employment
  position text not null check (btrim(position) <> ''),
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'project_based')),
  status text not null default 'active' check (status in ('active', 'on_leave', 'resigned', 'terminated')),
  date_hired date not null,
  date_separated date,
  work_schedule text,
  timezone text default 'Asia/Manila',
  rate numeric(12, 2) check (rate >= 0),
  rate_basis text check (rate_basis in ('hourly', 'monthly')),
  skills text[] not null default '{}',

  -- Payout
  payout_method text,
  payout_account_name text,
  payout_account_no text,

  -- Emergency contact
  emergency_name text,
  emergency_relationship text,
  emergency_mobile text,

  -- Education
  education_attainment text check (education_attainment in (
    'high_school', 'vocational', 'college_undergraduate', 'bachelors', 'masters', 'doctorate')),
  education_school text,
  education_course text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,

  constraint employees_separation_dates check (
    date_separated is null or date_separated >= date_hired),
  constraint employees_separated_needs_date check (
    status not in ('resigned', 'terminated') or date_separated is not null)
);

create unique index employees_personal_email_key on public.employees (lower(personal_email));
create index employees_status_idx on public.employees (status);
create index employees_created_by_idx on public.employees (created_by);

create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

alter table public.employees enable row level security;

-- ------------------------------------------------------- employee_documents
create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  doc_type text not null check (doc_type in (
    'resume', 'government_id', 'nbi_clearance', 'contract', 'nda', 'other')),
  label text,
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes integer,
  expires_on date,
  created_at timestamptz not null default now(),
  created_by text
);

create index employee_documents_employee_idx on public.employee_documents (employee_id);
alter table public.employee_documents enable row level security;

-- ------------------------------------------------------- employment_history
create table public.employment_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  date_hired date not null,
  date_separated date not null,
  separation_status text not null check (separation_status in ('resigned', 'terminated')),
  created_at timestamptz not null default now()
);

create index employment_history_employee_idx on public.employment_history (employee_id);
alter table public.employment_history enable row level security;

-- --------------------------------------------------------------- rehire flow
-- Moves the current (ended) stint into employment_history and reactivates the
-- same 201 file, in one transaction.
create or replace function public.rehire_employee(
  p_employee_id uuid,
  p_date_hired date,
  p_status text,
  p_updated_by text
) returns void
language plpgsql
set search_path = ''
as $$
declare
  e public.employees%rowtype;
begin
  select * into e from public.employees where id = p_employee_id for update;
  if not found then
    raise exception 'employee not found';
  end if;
  if e.status not in ('resigned', 'terminated') then
    raise exception 'employee is not separated';
  end if;
  if p_status not in ('active', 'on_leave') then
    raise exception 'rehire status must be active or on_leave';
  end if;
  if p_date_hired is null or p_date_hired <= e.date_separated then
    raise exception 'new hire date must be after the separation date';
  end if;

  insert into public.employment_history (employee_id, date_hired, date_separated, separation_status)
  values (e.id, e.date_hired, e.date_separated, e.status);

  update public.employees
     set date_hired = p_date_hired,
         date_separated = null,
         status = p_status,
         updated_by = p_updated_by
   where id = e.id;
end;
$$;

revoke execute on function public.rehire_employee(uuid, date, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------- storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
