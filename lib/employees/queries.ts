import "server-only";
import { withManager } from "@/lib/data/db";
import { isUuid, searchTerm } from "@/lib/validation/action";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "./labels";
import type { EmployeeInput } from "./schema";

export const PAGE_SIZE = 25;

export type EmployeeRow = EmployeeInput & {
  id: string;
  seq: number;
  employee_no: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type EmployeeDocument = {
  id: string;
  doc_type: string;
  label: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  expires_on: string | null;
  created_at: string;
};

export type EmploymentStint = {
  id: string;
  date_hired: string;
  date_separated: string;
  separation_status: "resigned" | "terminated";
};

export type AssignedClient = { id: string; company_name: string; status: string; assigned_on: string };

export type EmployeeDetail = EmployeeRow & {
  documents: EmployeeDocument[];
  history: EmploymentStint[];
  clients: AssignedClient[];
};

export type EmployeeListItem = Pick<
  EmployeeRow,
  "id" | "employee_no" | "first_name" | "last_name" | "nickname" | "position" | "status" | "date_hired" | "personal_email" | "created_by"
> & { clients: { id: string; company_name: string }[] };

export const DEFAULT_EMPLOYEE_STATUSES: EmployeeStatus[] = ["active", "on_leave"];

export function parseStatuses(raw: string | undefined): EmployeeStatus[] {
  if (raw === "all") return [...EMPLOYEE_STATUSES];
  const picked = (raw ?? "").split(",").filter((s): s is EmployeeStatus =>
    (EMPLOYEE_STATUSES as readonly string[]).includes(s),
  );
  return picked.length ? picked : DEFAULT_EMPLOYEE_STATUSES;
}

type Assignment = { client: { id: string; company_name: string; status?: string } | null; assigned_on?: string };

export async function listEmployees(opts: {
  q?: string;
  statuses: EmployeeStatus[];
  devOnly?: boolean;
  page?: number;
}): Promise<{ rows: EmployeeListItem[]; total: number }> {
  return withManager(async (db) => {
    const page = Math.max(1, opts.page ?? 1);
    let query = db
      .from("employees")
      .select(
        "id, employee_no, first_name, last_name, nickname, position, status, date_hired, personal_email, created_by, client_assignments(client:clients(id, company_name))",
        { count: "exact" },
      )
      .in("status", opts.statuses)
      .order("date_hired", { ascending: false })
      .order("seq", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const q = searchTerm(opts.q);
    if (q) {
      const like = `%${q}%`;
      query = query.or(
        [
          `first_name.ilike.${like}`,
          `last_name.ilike.${like}`,
          `nickname.ilike.${like}`,
          `employee_no.ilike.${like}`,
          `personal_email.ilike.${like}`,
        ].join(","),
      );
    }
    if (opts.devOnly) query = query.eq("created_by", DEV_MANAGER.email);

    const { data, error, count } = await query;
    if (error) throw error;
    // Embedded to-one relations come back as objects; supabase-js types them loosely.
    const rows = ((data ?? []) as unknown as (Omit<EmployeeListItem, "clients"> & {
      client_assignments: Assignment[];
    })[]).map(({ client_assignments, ...rest }) => ({
      ...rest,
      clients: client_assignments.flatMap((a) =>
        a.client ? [{ id: a.client.id, company_name: a.client.company_name }] : [],
      ),
    }));
    return { rows, total: count ?? 0 };
  });
}

export async function getEmployee(id: string): Promise<EmployeeDetail | null> {
  if (!isUuid(id)) return null;
  return withManager(async (db) => {
    const { data, error } = await db
      .from("employees")
      .select(
        "*, employee_documents(id, doc_type, label, file_name, mime_type, size_bytes, expires_on, created_at), employment_history(id, date_hired, date_separated, separation_status), client_assignments(assigned_on, client:clients(id, company_name, status))",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { employee_documents, employment_history, client_assignments, ...row } = data as unknown as EmployeeRow & {
      employee_documents: EmployeeDocument[];
      employment_history: EmploymentStint[];
      client_assignments: Assignment[];
    };
    return {
      ...row,
      documents: [...employee_documents].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      history: [...employment_history].sort((a, b) => b.date_hired.localeCompare(a.date_hired)),
      clients: client_assignments.flatMap((a) =>
        a.client
          ? [{ id: a.client.id, company_name: a.client.company_name, status: a.client.status ?? "", assigned_on: a.assigned_on ?? "" }]
          : [],
      ),
    };
  });
}

/** Active / on-leave employees for the client assignment picker. */
export async function listAssignableEmployees(): Promise<
  { id: string; employee_no: string; first_name: string; last_name: string; position: string }[]
> {
  return withManager(async (db) => {
    const { data, error } = await db
      .from("employees")
      .select("id, employee_no, first_name, last_name, position")
      .in("status", ["active", "on_leave"])
      .order("last_name");
    if (error) throw error;
    return data ?? [];
  });
}
