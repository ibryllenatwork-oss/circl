import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  formatSSS,
  formatPhilHealth,
  formatPagIbig,
  formatTIN,
  formatPHMobile,
  optionalSSS,
  optionalPHMobile,
  uniqueViolationField,
} from "./ph";

describe("government ID formatters", () => {
  it("formats SSS", () => {
    expect(formatSSS("3412345678")).toBe("34-1234567-8");
    expect(formatSSS("34-1234567-8")).toBe("34-1234567-8");
    expect(formatSSS(" 34 1234567 8 ")).toBe("34-1234567-8");
    expect(formatSSS("123")).toBeNull();
  });
  it("formats PhilHealth", () => {
    expect(formatPhilHealth("123456789012")).toBe("12-345678901-2");
    expect(formatPhilHealth("12345")).toBeNull();
  });
  it("formats Pag-IBIG", () => {
    expect(formatPagIbig("123456789012")).toBe("1234-5678-9012");
    expect(formatPagIbig("1234-5678-901")).toBeNull();
  });
  it("formats TIN with 9 or 12 digits", () => {
    expect(formatTIN("123456789")).toBe("123-456-789");
    expect(formatTIN("123456789000")).toBe("123-456-789-000");
    expect(formatTIN("1234567890")).toBeNull();
  });
  it("rejects letters", () => expect(formatSSS("34-12345A7-8")).toBeNull());
});

describe("formatPHMobile", () => {
  it.each(["09171234567", "+639171234567", "639171234567", "0917 123 4567", "0917-123-4567"])(
    "normalizes %s",
    (v) => expect(formatPHMobile(v)).toBe("+639171234567"),
  );
  it.each(["08171234567", "12345", "+6391712345678", "+1 415 555 0100"])("rejects %s", (v) =>
    expect(formatPHMobile(v)).toBeNull(),
  );
});

describe("optional zod helpers", () => {
  const schema = z.object({ sss: optionalSSS, mobile: optionalPHMobile });
  it("turns blanks into null", () =>
    expect(schema.parse({ sss: "  ", mobile: "" })).toEqual({ sss: null, mobile: null }));
  it("normalizes valid values", () =>
    expect(schema.parse({ sss: "3412345678", mobile: "09171234567" })).toEqual({
      sss: "34-1234567-8",
      mobile: "+639171234567",
    }));
  it("reports invalid values", () => {
    const r = schema.safeParse({ sss: "123", mobile: "555" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["sss", "mobile"]));
    }
  });
});

describe("uniqueViolationField", () => {
  const map = { employees_personal_email_key: "personal_email" };
  it("maps a unique violation on a known index", () =>
    expect(
      uniqueViolationField(
        { code: "23505", message: 'duplicate key value violates unique constraint "employees_personal_email_key"' },
        map,
      ),
    ).toBe("personal_email"));
  it("ignores other errors", () => {
    expect(uniqueViolationField({ code: "23503", message: "employees_personal_email_key" }, map)).toBeNull();
    expect(uniqueViolationField({ code: "23505", message: "something_else_key" }, map)).toBeNull();
    expect(uniqueViolationField(null, map)).toBeNull();
  });
});
