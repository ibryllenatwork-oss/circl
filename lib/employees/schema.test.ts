import { describe, it, expect } from "vitest";
import { parseEmployeeForm, isRehire } from "./schema";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const valid = {
  first_name: "Ana",
  last_name: "Cruz",
  personal_email: "Ana@Example.com",
  position: "General Virtual Assistant",
  employment_type: "full_time",
  status: "active",
  date_hired: "2025-01-06",
};

describe("parseEmployeeForm", () => {
  it("accepts the required fields and normalizes", () => {
    const r = parseEmployeeForm(form({ ...valid, sss_no: "3412345678", mobile: "0917 123 4567", skills: "Canva, GoHighLevel ,", rate: "150" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.personal_email).toBe("ana@example.com");
      expect(r.data.sss_no).toBe("34-1234567-8");
      expect(r.data.mobile).toBe("+639171234567");
      expect(r.data.skills).toEqual(["Canva", "GoHighLevel"]);
      expect(r.data.rate).toBe(150);
      expect(r.data.middle_name).toBeNull();
      expect(r.data.date_separated).toBeNull();
    }
  });

  it("names every missing required field", () => {
    const r = parseEmployeeForm(form({}));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.fieldErrors)).toEqual(
        expect.arrayContaining(["first_name", "last_name", "personal_email", "position", "employment_type", "date_hired"]),
      );
    }
  });

  it("requires a separation date for resigned/terminated", () => {
    const r = parseEmployeeForm(form({ ...valid, status: "resigned" }));
    expect(!r.ok && r.fieldErrors.date_separated).toBeTruthy();
  });

  it("rejects a separation date before the hire date", () => {
    const r = parseEmployeeForm(form({ ...valid, status: "terminated", date_separated: "2024-12-31" }));
    expect(!r.ok && r.fieldErrors.date_separated).toBeTruthy();
  });

  it("drops a separation date when the employee is active", () => {
    const r = parseEmployeeForm(form({ ...valid, date_separated: "2025-03-01" }));
    expect(r.ok && r.data.date_separated).toBeNull();
  });

  it("rejects invalid IDs, email and negative rate", () => {
    const r = parseEmployeeForm(form({ ...valid, tin: "1234", personal_email: "nope", rate: "-1" }));
    expect(!r.ok && Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["tin", "personal_email", "rate"]));
  });

  it("requires a new hire date when reactivating a separated employee", () => {
    const previous = { status: "resigned" as const, date_hired: "2025-01-06", date_separated: "2025-06-30" };
    const same = parseEmployeeForm(form({ ...valid, status: "active", date_hired: "2025-01-06" }), { previous });
    expect(!same.ok && same.fieldErrors.date_hired).toBeTruthy();
    const before = parseEmployeeForm(form({ ...valid, status: "active", date_hired: "2025-06-01" }), { previous });
    expect(!before.ok && before.fieldErrors.date_hired).toBeTruthy();
    const ok = parseEmployeeForm(form({ ...valid, status: "active", date_hired: "2025-09-01" }), { previous });
    expect(ok.ok).toBe(true);
  });
});

describe("isRehire", () => {
  it.each([
    ["resigned", "active", true],
    ["terminated", "on_leave", true],
    ["active", "on_leave", false],
    ["resigned", "terminated", false],
    ["active", "active", false],
  ] as const)("%s -> %s is %s", (a, b, expected) => expect(isRehire(a, b)).toBe(expected));
});
