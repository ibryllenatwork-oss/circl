import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { formatPct, rateMargin, type Rate } from "@/lib/services/pricing";

export const usd = (n: number) => formatMoney(n, "USD");

/** Margin chip: neutral when ≥ 0, red when negative. */
export function MarginChip({ amount, pct, suffix = "" }: { amount: number; pct: number | null; suffix?: string }) {
  const negative = amount < 0;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        negative ? "bg-badge-error-bg text-badge-error" : "bg-badge-success-bg text-badge-success",
      )}
    >
      {negative ? "−" : "+"}
      {usd(Math.abs(amount))}
      {suffix} · {formatPct(pct)}
    </span>
  );
}

/** Client rate over VA rate, with the margin chip; "—" when the tier has no rate. */
export function RateCell({ rate }: { rate?: Rate }) {
  if (!rate) return <span className="text-muted-foreground/70">—</span>;
  const m = rateMargin(rate.client_rate, rate.va_rate);
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="tabular text-sm font-medium">
        {usd(rate.client_rate)}
        <span className="text-xs font-normal text-muted-foreground"> /hr</span>
      </span>
      <span className="tabular text-xs text-muted-foreground">VA {usd(rate.va_rate)}</span>
      <MarginChip amount={m.amount} pct={m.pct} />
    </div>
  );
}
