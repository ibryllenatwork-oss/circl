-- 1) Employees are either circl. admins (internal team) or virtual assistants.
alter table public.employees
  add column employee_type text not null default 'va'
  check (employee_type in ('admin', 'va'));

create index employees_type_idx on public.employees (employee_type);

-- Admins do client work? No: only VAs can be assigned to clients.
create or replace function public.client_assignments_va_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.employees e where e.id = new.employee_id and e.employee_type <> 'va') then
    raise exception 'admin_not_assignable: only virtual assistants can be assigned to clients';
  end if;
  return new;
end;
$$;

create trigger client_assignments_va_only
  before insert or update of employee_id on public.client_assignments
  for each row execute function public.client_assignments_va_only();

-- A VA who is assigned to clients can't be turned into an admin until unassigned.
create or replace function public.employees_type_change_check()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.employee_type = 'admin' and old.employee_type <> 'admin'
     and exists (select 1 from public.client_assignments a where a.employee_id = new.id) then
    raise exception 'assigned_va_to_admin: remove this VA from their clients before making them an admin';
  end if;
  return new;
end;
$$;

create trigger employees_type_change_check
  before update of employee_type on public.employees
  for each row execute function public.employees_type_change_check();

-- 2) Packages get a status: draft (work in progress), active, archived.
alter table public.packages
  add column status text not null default 'active'
  check (status in ('draft', 'active', 'archived'));

update public.packages set status = case when active then 'active' else 'archived' end;

alter table public.packages drop column active;

create index packages_status_idx on public.packages (status);

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
    insert into public.packages (name, description, monthly_amount, status, notes, created_by, updated_by)
    values (
      p_package ->> 'name',
      nullif(p_package ->> 'description', ''),
      (p_package ->> 'monthly_amount')::numeric,
      coalesce(nullif(p_package ->> 'status', ''), 'draft'),
      nullif(p_package ->> 'notes', ''),
      p_actor, p_actor)
    returning id into v_id;
  else
    update public.packages set
      name = p_package ->> 'name',
      description = nullif(p_package ->> 'description', ''),
      monthly_amount = (p_package ->> 'monthly_amount')::numeric,
      status = coalesce(nullif(p_package ->> 'status', ''), status),
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
