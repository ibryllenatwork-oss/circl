const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-01-06" → "Jan 6, 2025" (string-based, so no timezone shift). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Today's date in Manila as YYYY-MM-DD. */
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ExpiryState = "none" | "expired" | "soon" | "ok";

/** expired: before today; soon: today through 30 days ahead. */
export function expiryState(expiresOn: string | null | undefined, today = todayInManila()): ExpiryState {
  if (!expiresOn) return "none";
  if (expiresOn < today) return "expired";
  if (expiresOn <= addDays(today, 30)) return "soon";
  return "ok";
}

export function latestExpiry(
  docs: { doc_type: string; expires_on: string | null }[],
  docType: string,
): string | null {
  return (
    docs
      .filter((d) => d.doc_type === docType && d.expires_on)
      .map((d) => d.expires_on as string)
      .sort()
      .at(-1) ?? null
  );
}

export function fullName(p: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
}): string {
  return [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(" ");
}

export function maskValue(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 4) return "•".repeat(value.length);
  return `••••${value.slice(-4)}`;
}

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(
    amount,
  );
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
