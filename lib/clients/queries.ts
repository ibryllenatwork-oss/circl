import "server-only";
import { withManager } from "@/lib/data/db";
import { isUuid, searchTerm } from "@/lib/validation/action";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";
import { CLIENT_STATUSES } from "./labels";
import type { ClientInput, ContactInput } from "./schema";

export const CLIENT_PAGE_SIZE = 25;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export const DEFAULT_CLIENT_STATUSES: ClientStatus[] = ["prospect", "active", "paused"];

export function parseClientStatuses(raw: string | undefined): ClientStatus[] {
  if (raw === "all") return [...CLIENT_STATUSES];
  const picked = (raw ?? "").split(",").filter((s): s is ClientStatus =>
    (CLIENT_STATUSES as readonly string[]).includes(s),
  );
  return picked.length ? picked : DEFAULT_CLIENT_STATUSES;
}

export type ClientRow = ClientInput & {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type ContactRow = ContactInput & { id: string; position: number };

export type AssignedVA = {
  id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  position: string;
  status: string;
  assigned_on: string;
};

export type ClientDocument = {
  id: string;
  doc_type: string;
  label: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  expires_on: string | null;
  created_at: string;
};

export type ClientDetail = ClientRow & { contacts: ContactRow[]; vas: AssignedVA[]; documents: ClientDocument[] };

export type ClientListItem = Pick<ClientRow, "id" | "company_name" | "status" | "contract_end" | "created_by"> & {
  primary_contact: string | null;
  va_count: number;
};

export async function listClients(opts: {
  q?: string;
  statuses: ClientStatus[];
  devOnly?: boolean;
  page?: number;
}): Promise<{ rows: ClientListItem[]; total: number }> {
  return withManager(async (db) => {
    const page = Math.max(1, opts.page ?? 1);
    const q = searchTerm(opts.q);

    // Contact-name matches: find their client ids first (PostgREST can't OR across tables).
    let contactClientIds: string[] = [];
    if (q) {
      const { data, error } = await db.from("client_contacts").select("client_id").ilike("name", `%${q}%`).limit(200);
      if (error) throw error;
      contactClientIds = [...new Set((data ?? []).map((r) => r.client_id as string))];
    }

    let query = db
      .from("clients")
      .select("id, company_name, status, contract_end, created_by, client_contacts(name, is_primary), client_assignments(employee_id)", {
        count: "exact",
      })
      .in("status", opts.statuses)
      .order("company_name")
      .range((page - 1) * CLIENT_PAGE_SIZE, page * CLIENT_PAGE_SIZE - 1);

    if (q) {
      const filters = [`company_name.ilike.%${q}%`];
      if (contactClientIds.length) filters.push(`id.in.(${contactClientIds.join(",")})`);
      query = query.or(filters.join(","));
    }
    if (opts.devOnly) query = query.eq("created_by", DEV_MANAGER.email);

    const { data, error, count } = await query;
    // Page past the end (stale link, last row deleted): show an empty page, not an error.
    if (error?.code === "PGRST103") return { rows: [], total: page > 1 ? (await listClients({ ...opts, page: 1 })).total : 0 };
    if (error) throw error;
    const rows = ((data ?? []) as unknown as (Omit<ClientListItem, "primary_contact" | "va_count"> & {
      client_contacts: { name: string; is_primary: boolean }[];
      client_assignments: { employee_id: string }[];
    })[]).map(({ client_contacts, client_assignments, ...rest }) => ({
      ...rest,
      primary_contact: client_contacts.find((c) => c.is_primary)?.name ?? client_contacts[0]?.name ?? null,
      va_count: client_assignments.length,
    }));
    return { rows, total: count ?? 0 };
  });
}

type RawAssignment = {
  assigned_on: string;
  employee: Omit<AssignedVA, "assigned_on"> | null;
};

export async function getClient(id: string): Promise<ClientDetail | null> {
  if (!isUuid(id)) return null;
  return withManager(async (db) => {
    const { data, error } = await db
      .from("clients")
      .select(
        "*, client_contacts(id, name, role, email, phone, is_primary, position), client_documents(id, doc_type, label, file_name, mime_type, size_bytes, expires_on, created_at), client_assignments(assigned_on, employee:employees(id, employee_no, first_name, last_name, position, status))",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { client_contacts, client_documents, client_assignments, ...row } = data as unknown as ClientRow & {
      client_contacts: ContactRow[];
      client_documents: ClientDocument[];
      client_assignments: RawAssignment[];
    };
    return {
      ...row,
      contacts: [...client_contacts].sort((a, b) => a.position - b.position),
      documents: [...client_documents].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      vas: client_assignments
        .flatMap((a) => (a.employee ? [{ ...a.employee, assigned_on: a.assigned_on }] : []))
        .sort((a, b) => a.last_name.localeCompare(b.last_name)),
    };
  });
}
