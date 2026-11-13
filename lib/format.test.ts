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
