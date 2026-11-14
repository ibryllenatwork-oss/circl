import { describe, it, expect } from "vitest";
import { rateMargin, packageTotals, effectiveActive, type RateTable } from "./pricing";

describe("rateMargin", () => {
  it("computes amount and percent of the client rate", () => {
    const m = rateMargin(12, 7);
    expect(m.amount).toBe(5);
    expect(m.pct).toBeCloseTo(41.67, 2);
  });
  it("is negative when the VA earns more", () => expect(rateMargin(10, 12).amount).toBe(-2));
  it("has no percent when the client rate is 0", () => expect(rateMargin(0, 5).pct).toBeNull());
});

describe("packageTotals", () => {
  // Spec example: Email management Intermediate 40 h + Calendar management Entry 20 h.
  const rates: RateTable = {
    email: { intermediate: { client_rate: 18, va_rate: 10 } },
    cal: { entry: { client_rate: 12, va_rate: 6 } },
  };
  const lines = [
    { service_id: "email", tier: "intermediate" as const, hours_per_month: 40 },
    { service_id: "cal", tier: "entry" as const, hours_per_month: 20 },
  ];

  it("matches the hand calculation", () => {
    // value: 18×40 + 12×20 = 720 + 240 = 960; cost: 10×40 + 6×20 = 400 + 120 = 520
    const t = packageTotals(lines, rates, 900);
    expect(t).toMatchObject({ hours: 60, standardValue: 960, vaCost: 520, amount: 900, discount: 60, margin: 380, missingRates: 0 });
    expect(t.discountPct).toBeCloseTo(6.25, 5);
    expect(t.marginPct).toBeCloseTo(42.22, 2);
  });

  it("reports a premium as a negative discount", () => {
    expect(packageTotals(lines, rates, 1000).discount).toBe(-40);
  });

  it("counts lines without a rate and leaves them out of the money totals", () => {
    const t = packageTotals([...lines, { service_id: "cal", tier: "expert" as const, hours_per_month: 5 }], rates, 900);
    expect(t).toMatchObject({ hours: 65, standardValue: 960, vaCost: 520, missingRates: 1 });
  });

  it("avoids dividing by zero", () => {
    const t = packageTotals([], rates, 0);
    expect(t).toMatchObject({ standardValue: 0, discountPct: null, marginPct: null, margin: 0 });
  });

  it("ignores non-positive or non-numeric hours", () => {
    const t = packageTotals([{ service_id: "cal", tier: "entry", hours_per_month: Number.NaN }], rates, 0);
    expect(t.hours).toBe(0);
    expect(t.standardValue).toBe(0);
  });
});

describe("effectiveActive", () => {
  it.each([
    [true, null, true],
    [false, null, false],
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ] as const)("self %s, parent %s → %s", (self, parent, expected) =>
    expect(effectiveActive(self, parent)).toBe(expected));
});
