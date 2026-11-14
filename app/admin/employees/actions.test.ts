import { describe, it, expect, vi, beforeEach } from "vitest";

// A tiny fake of the supabase query builder that records calls in order.
const calls: string[] = [];
let updateError: { code: string; message: string } | null = null;
let deleteError: { code: string; message: string } | null = null;
let current: Record<string, unknown> = {};

function builder(table: string) {
  const b: Record<string, unknown> = {};
  let op = "select";
  const chain = () => b;
  Object.assign(b, {
    select: () => (op === "select" ? b : b),
    eq: chain,
    update: () => {
      op = "update";
      calls.push(`update:${table}`);
      return b;
    },
    delete: () => {
      op = "delete";
      calls.push(`delete:${table}`);
      return b;
    },
    maybeSingle: async () => ({ data: current, error: null }),
    then: (resolve: (v: unknown) => void) =>
      resolve({ error: op === "update" ? updateError : op === "delete" ? deleteError : null }),
  });
  return b;
}

const fakeDb = {
  from: (table: string) => builder(table),
  rpc: async (name: string) => {
    calls.push(`rpc:${name}`);
    return { error: null };
  },
  storage: {
    from: () => ({
      list: async () => {
        calls.push("storage:list");
        return { data: [], error: null };
      },
      remove: async () => ({ error: null }),
    }),
  },
};

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/data/db", () => ({
  UnauthorizedError: class extends Error {},
  withManager: (fn: (db: unknown, me: unknown) => unknown) =>
    fn(fakeDb, { id: "m1", email: "mgr@circl.ph", isSuperadmin: true }),
}));

import { deleteEmployee, updateEmployee } from "./actions";

const ID = "3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const rehireForm = form({
  first_name: "Ana",
  last_name: "Cruz",
  personal_email: "taken@example.com",
  position: "VA",
  employment_type: "full_time",
  status: "active",
  date_hired: "2025-09-01",
});

describe("updateEmployee rehire", () => {
  beforeEach(() => {
    calls.length = 0;
    updateError = null;
    deleteError = null;
    current = { status: "resigned", date_hired: "2025-01-06", date_separated: "2025-06-30" };
  });

  it("does not rehire when saving the other fields fails (e.g. duplicate email)", async () => {
    updateError = { code: "23505", message: "employees_personal_email_key" };
    const result = await updateEmployee(ID, null, rehireForm);
    expect(result.fieldErrors?.personal_email).toBeTruthy();
    expect(calls).not.toContain("rpc:rehire_employee");
  });

  it("saves the other fields, then rehires", async () => {
    await expect(updateEmployee(ID, null, rehireForm)).rejects.toThrow("NEXT_REDIRECT");
    expect(calls).toEqual(["update:employees", "rpc:rehire_employee"]);
  });
});

describe("updateEmployee type change", () => {
  beforeEach(() => {
    calls.length = 0;
    deleteError = null;
    current = { status: "active", date_hired: "2025-01-06", date_separated: null };
  });

  it("explains why an assigned VA can't become an admin", async () => {
    updateError = { code: "P0001", message: "assigned_va_to_admin: remove this VA from their clients before making them an admin" };
    const fd = form({
      first_name: "Ana",
      last_name: "Cruz",
      personal_email: "ana@example.com",
      position: "VA",
      employment_type: "full_time",
      status: "active",
      date_hired: "2025-01-06",
      employee_type: "admin",
    });
    const result = await updateEmployee(ID, null, fd);
    expect(result.fieldErrors?.employee_type).toMatch(/remove .* from their clients/i);
  });
});

describe("deleteEmployee", () => {
  beforeEach(() => {
    calls.length = 0;
    updateError = null;
    deleteError = null;
    current = { employee_no: "CIRCL-0001" };
  });

  it("keeps the files when the row delete fails", async () => {
    deleteError = { code: "57014", message: "timeout" };
    const result = await deleteEmployee(ID, "CIRCL-0001");
    expect(result.ok).toBe(false);
    expect(calls).toEqual(["delete:employees"]);
  });

  it("deletes the row first, then the files", async () => {
    await expect(deleteEmployee(ID, "circl-0001")).rejects.toThrow("NEXT_REDIRECT");
    expect(calls).toEqual(["delete:employees", "storage:list"]);
  });
});
