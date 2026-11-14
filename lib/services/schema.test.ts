import { describe, it, expect } from "vitest";
import { parseServiceForm, parseRatesForm, parsePackageForm } from "./schema";

const fd = (v: Record<string, string>) => {
  const f = new FormData();
  for (const [k, x] of Object.entries(v)) f.set(k, x);
  return f;
};
const S1 = "3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f";
const S2 = "11111111-2222-4333-8444-555555555555";

describe("parseServiceForm", () => {
  it("accepts a top-level service", () => {
    const r = parseServiceForm(fd({ name: "  Bookkeeping ", description: "" }));
    expect(r).toEqual({ ok: true, data: { name: "Bookkeeping", description: null, parent_id: null } });
  });
  it("accepts a parent id", () => {
    const r = parseServiceForm(fd({ name: "Email", parent_id: S1 }));
    expect(r.ok && r.data.parent_id).toBe(S1);
  });
  it("rejects a blank name and a bad parent", () => {
    const r = parseServiceForm(fd({ name: " ", parent_id: "nope" }));
    expect(!r.ok && Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["name", "parent_id"]));
  });
});

describe("parseRatesForm", () => {
  it("accepts filled and fully blank tiers", () => {
    const r = parseRatesForm(fd({ entry_client: "12", entry_va: "7", intermediate_client: "", intermediate_va: "", expert_client: "20.5", expert_va: "11" }));
    expect(r).toEqual({
      ok: true,
      data: [
        { tier: "entry", client_rate: 12, va_rate: 7 },
        { tier: "intermediate", client_rate: null, va_rate: null },
        { tier: "expert", client_rate: 20.5, va_rate: 11 },
      ],
    });
  });
  it("requires both sides of a tier", () => {
    const r = parseRatesForm(fd({ entry_client: "12", entry_va: "" }));
    expect(!r.ok && r.fieldErrors.entry_va).toMatch(/both/i);
  });
  it("rejects fractions of a cent", () => {
    const r = parseRatesForm(fd({ entry_client: "12.345", entry_va: "7" }));
    expect(!r.ok && r.fieldErrors.entry_client).toMatch(/cents/i);
  });
  it("rejects negatives and absurd values", () => {
    const r = parseRatesForm(fd({ entry_client: "-1", entry_va: "5", expert_client: "20000", expert_va: "5" }));
    expect(!r.ok && Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["entry_client", "expert_client"]));
  });
});

describe("parsePackageForm", () => {
  const lines = (l: unknown) => JSON.stringify(l);
  const base = { name: "Starter Admin", monthly_amount: "900", status: "active" };

  it("accepts a package with lines", () => {
    const r = parsePackageForm(fd({ ...base, lines: lines([{ service_id: S1, tier: "intermediate", hours_per_month: "40" }]) }));
    expect(r.ok && r.data.package).toMatchObject({ name: "Starter Admin", monthly_amount: 900, status: "active" });
    expect(r.ok && r.data.lines).toEqual([{ service_id: S1, tier: "intermediate", hours_per_month: 40 }]);
  });
  it("needs a name, an amount and at least one line", () => {
    const r = parsePackageForm(fd({ name: "", monthly_amount: "", lines: "[]" }));
    expect(!r.ok && Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["name", "monthly_amount", "lines"]));
  });
  it("rejects the same service and tier twice", () => {
    const r = parsePackageForm(fd({ ...base, lines: lines([
      { service_id: S1, tier: "entry", hours_per_month: "10" },
      { service_id: S1, tier: "entry", hours_per_month: "5" },
    ]) }));
    expect(!r.ok && r.fieldErrors.lines).toMatch(/twice/i);
  });
  it("allows the same service at different tiers", () => {
    const r = parsePackageForm(fd({ ...base, lines: lines([
      { service_id: S1, tier: "entry", hours_per_month: "10" },
      { service_id: S1, tier: "expert", hours_per_month: "5" },
      { service_id: S2, tier: "entry", hours_per_month: "5" },
    ]) }));
    expect(r.ok).toBe(true);
  });
  it("validates each line", () => {
    const r = parsePackageForm(fd({ ...base, lines: lines([{ service_id: "", tier: "guru", hours_per_month: "0" }]) }));
    expect(!r.ok && r.fieldErrors.lines).toMatch(/^Line 1:/);
  });
  it("defaults the status to draft and rejects unknown statuses", () => {
    const one = lines([{ service_id: S1, tier: "entry", hours_per_month: "1" }]);
    const r = parsePackageForm(fd({ name: "X", monthly_amount: "1", lines: one }));
    expect(r.ok && r.data.package.status).toBe("draft");
    const bad = parsePackageForm(fd({ name: "X", monthly_amount: "1", status: "live", lines: one }));
    expect(!bad.ok && bad.fieldErrors.status).toBeTruthy();
  });
  it("allows one decimal for hours and two for the amount", () => {
    const ok1 = parsePackageForm(fd({ ...base, monthly_amount: "899.99", lines: lines([{ service_id: S1, tier: "entry", hours_per_month: "7.5" }]) }));
    expect(ok1.ok).toBe(true);
    const hrs = parsePackageForm(fd({ ...base, lines: lines([{ service_id: S1, tier: "entry", hours_per_month: "7.25" }]) }));
    expect(!hrs.ok && hrs.fieldErrors.lines).toMatch(/one decimal/i);
    const amt = parsePackageForm(fd({ ...base, monthly_amount: "900.123", lines: lines([{ service_id: S1, tier: "entry", hours_per_month: "1" }]) }));
    expect(!amt.ok && amt.fieldErrors.monthly_amount).toMatch(/cents/i);
  });
});
