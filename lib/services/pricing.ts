export const TIERS = ["entry", "intermediate", "expert"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  entry: "Entry",
  intermediate: "Intermediate",
  expert: "Expert",
};

export type Rate = { client_rate: number; va_rate: number };
/** service_id → tier → rate (missing tiers are simply absent) */
export type RateTable = Record<string, Partial<Record<Tier, Rate>>>;
export type Line = { service_id: string; tier: Tier; hours_per_month: number };

/** Margin per hour and as a percent of the client rate (null when the client rate is 0). */
export function rateMargin(clientRate: number, vaRate: number): { amount: number; pct: number | null } {
  const amount = clientRate - vaRate;
  return { amount, pct: clientRate > 0 ? (amount / clientRate) * 100 : null };
}

export type PackageTotals = {
  hours: number;
  standardValue: number;
  vaCost: number;
  amount: number;
  /** standardValue − amount; negative means a premium over standard rates */
  discount: number;
  discountPct: number | null;
  margin: number;
  marginPct: number | null;
  missingRates: number;
};

const positive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Totals for a package from the current rates. Lines without a rate count toward hours only. */
export function packageTotals(lines: Line[], rates: RateTable, amount: number): PackageTotals {
  let hours = 0;
  let standardValue = 0;
  let vaCost = 0;
  let missingRates = 0;
  for (const line of lines) {
    const h = positive(Number(line.hours_per_month));
    hours += h;
    const rate = rates[line.service_id]?.[line.tier];
    if (!rate) {
      missingRates += 1;
      continue;
    }
    standardValue += rate.client_rate * h;
    vaCost += rate.va_rate * h;
  }
  const amt = Number.isFinite(amount) ? amount : 0;
  const discount = standardValue - amt;
  const margin = amt - vaCost;
  return {
    hours,
    standardValue,
    vaCost,
    amount: amt,
    discount,
    discountPct: standardValue > 0 ? (discount / standardValue) * 100 : null,
    margin,
    marginPct: amt > 0 ? (margin / amt) * 100 : null,
    missingRates,
  };
}

/** A subservice is only usable when it and its parent are active (parent null = top-level). */
export function effectiveActive(selfActive: boolean, parentActive: boolean | null): boolean {
  return selfActive && parentActive !== false;
}

export function formatPct(pct: number | null): string {
  return pct == null ? "—" : `${pct.toFixed(1)}%`;
}
