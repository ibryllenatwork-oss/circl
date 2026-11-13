import { describe, it, expect } from "vitest";
import { expiryState, formatDate, fullName, latestExpiry, maskValue, formatMoney } from "./format";

describe("expiryState", () => {
  const today = "2026-11-14";
  it.each([
    [null, "none"],
    ["2026-11-13", "expired"],
    ["2026-11-14", "soon"],
    ["2026-12-14", "soon"],
    ["2026-12-15", "ok"],
  ] as const)("%s is %s", (d, expected) => expect(expiryState(d, today)).toBe(expected));
});

it("picks the latest expiry of a document type", () => {
  const docs = [
    { doc_type: "nbi_clearance", expires_on: "2025-01-01" },
    { doc_type: "nbi_clearance", expires_on: "2026-03-01" },
    { doc_type: "contract", expires_on: "2030-01-01" },
    { doc_type: "nbi_clearance", expires_on: null },
  ];
  expect(latestExpiry(docs, "nbi_clearance")).toBe("2026-03-01");
  expect(latestExpiry(docs, "nda")).toBeNull();
});

it("formats dates without timezone drift", () => {
  expect(formatDate("2025-01-06")).toBe("Jan 6, 2025");
  expect(formatDate(null)).toBe("—");
});

it("shows timestamps as the Manila calendar date", () => {
  // 16:30 UTC on Nov 13 is 00:30 on Nov 14 in Manila (UTC+8).
  expect(formatDate("2026-11-13T16:30:00.000+00:00")).toBe("Nov 14, 2026");
  expect(formatDate("2026-11-13T10:00:00Z")).toBe("Nov 13, 2026");
});

it("distinguishes dollar currencies", () => {
  expect(formatMoney(12.5, "AUD")).toBe("A$12.50");
  expect(formatMoney(12.5, "CAD")).toBe("CA$12.50");
});

it("builds full names", () => {
  expect(fullName({ first_name: "Ana", middle_name: "Reyes", last_name: "Cruz", suffix: "Jr." })).toBe(
    "Ana Reyes Cruz Jr.",
  );
  expect(fullName({ first_name: "Ana", last_name: "Cruz" })).toBe("Ana Cruz");
});

it("masks all but the last 4 characters", () => {
  expect(maskValue("34-1234567-8")).toBe("••••67-8");
  expect(maskValue("123")).toBe("•••");
  expect(maskValue(null)).toBe("—");
});

it("formats money with currency", () => {
  expect(formatMoney(150, "PHP")).toBe("₱150.00");
  expect(formatMoney(12.5, "USD")).toBe("$12.50");
  expect(formatMoney(null, "USD")).toBe("—");
});
