"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fieldClass } from "@/components/ui/input";
import { FormActions, FormAlert, FormSection, SelectField, TextAreaField, TextField } from "@/components/admin/form-fields";
import { PACKAGE_STATUSES, type PackageStatus } from "@/lib/services/schema";
import { useFocusFirstError } from "@/components/admin/use-focus-first-error";
import { packageTotals, TIER_LABELS, TIERS, formatPct, type RateTable, type Tier } from "@/lib/services/pricing";
import type { PickerOption } from "@/lib/services/queries";
import type { FormState } from "@/lib/validation/action";
import { cn } from "@/lib/utils";
import { usd } from "./money";

type Action = (prev: FormState | null, formData: FormData) => Promise<FormState>;
type DraftLine = { key: number; service_id: string; tier: Tier; hours: string };
export type BuilderPackage = {
  name: string;
  description: string | null;
  notes: string | null;
  status: PackageStatus;
  monthly_amount: number;
  lines: { service_id: string; tier: Tier; hours_per_month: number }[];
};

let nextKey = 1;
const blankLine = (): DraftLine => ({ key: nextKey++, service_id: "", tier: "intermediate", hours: "" });

function Totals({ lines, rates, amount, onUseStandard }: { lines: DraftLine[]; rates: RateTable; amount: number; onUseStandard: (v: number) => void }) {
  const t = packageTotals(
    lines.filter((l) => l.service_id).map((l) => ({ service_id: l.service_id, tier: l.tier, hours_per_month: Number(l.hours) })),
    rates,
    amount,
  );
  const row = (label: string, value: React.ReactNode, strong = false) => (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "text-base font-semibold")}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
  const negative = t.margin < 0;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
        <Calculator className="h-4 w-4 text-primary" aria-hidden /> Package totals
      </h2>
      <dl className="flex flex-col gap-2.5 text-sm">
        {row("Hours / month", t.hours.toLocaleString("en-US", { maximumFractionDigits: 1 }))}
        {row("Standard value", usd(t.standardValue))}
        {row("Package amount", usd(t.amount), true)}
        {row(
          t.discount >= 0 ? "Discount" : "Premium",
          <span className={t.discount < 0 ? "text-badge-success" : ""}>
            {usd(Math.abs(t.discount))} · {formatPct(t.discountPct == null ? null : Math.abs(t.discountPct))}
          </span>,
        )}
        <div className="my-1 border-t border-border/70" />
        {row("VA cost", usd(t.vaCost))}
      </dl>
      <div aria-live="polite" aria-atomic="true" className={cn("mt-4 rounded-lg px-4 py-3", negative ? "bg-badge-error-bg text-badge-error" : "bg-badge-success-bg text-badge-success")}>
        <p className="text-xs font-medium uppercase tracking-wide">Margin</p>
        <p className="tabular text-2xl font-semibold">
          {negative ? "−" : ""}
          {usd(Math.abs(t.margin))}
          <span className="ml-2 text-sm font-medium">{formatPct(t.marginPct)}</span>
        </p>
      </div>
      {t.missingRates > 0 && (
        <p className="mt-3 flex items-start gap-2 text-xs font-medium text-badge-pending">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Rates missing on {t.missingRates} line{t.missingRates === 1 ? "" : "s"}. Totals are incomplete.
        </p>
      )}
      <Button type="button" variant="secondary" size="sm" className="mt-4 w-full" disabled={t.standardValue === 0} onClick={() => onUseStandard(t.standardValue)}>
        Use standard value as amount
      </Button>
    </div>
  );
}

export function PackageBuilder({
  action,
  pkg,
  options,
  rates,
  submitLabel,
}: {
  action: Action;
  pkg: BuilderPackage | null;
  options: PickerOption[];
  rates: RateTable;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const restored = useMemo(() => {
    if (!state?.values?.lines) return null;
    try {
      return (JSON.parse(state.values.lines) as { service_id: string; tier: Tier; hours_per_month: string }[]).map((l) => ({
        key: nextKey++,
        service_id: l.service_id,
        tier: l.tier,
        hours: String(l.hours_per_month ?? ""),
      }));
    } catch {
      return null;
    }
  }, [state]);

  const [lines, setLines] = useState<DraftLine[]>(() =>
    pkg?.lines.length ? pkg.lines.map((l) => ({ key: nextKey++, service_id: l.service_id, tier: l.tier, hours: String(l.hours_per_month) })) : [blankLine()],
  );
  const [amount, setAmount] = useState(pkg ? String(pkg.monthly_amount) : "");
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (restored) setLines(restored);
    if (state?.values?.monthly_amount != null) setAmount(state.values.monthly_amount);
  }

  const v = state?.values ?? {};
  const err = state?.fieldErrors ?? {};
  const formKey = state ? JSON.stringify([state.fieldErrors, state.error]) : "initial";
  const formRef = useFocusFirstError(formKey);
  const optionById = new Map(options.map((o) => [o.id, o]));
  const groups = [...new Set(options.map((o) => o.group))];

  const update = (key: number, patch: Partial<DraftLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="lines" value={JSON.stringify(lines.map((l) => ({ service_id: l.service_id, tier: l.tier, hours_per_month: l.hours })))} />
      {state?.error && <FormAlert message={state.error} />}
      {Object.keys(err).length > 0 && <FormAlert message="Please fix the highlighted fields below." />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection title="Details" description="How this package appears in your catalog.">
            <TextField name="name" label="Package name" required defaultValue={v.name ?? pkg?.name} error={err.name} className="sm:col-span-2" />
            <SelectField
              name="status"
              label="Status"
              required
              allowBlank={false}
              options={PACKAGE_STATUSES}
              defaultValue={v.status ?? pkg?.status ?? "draft"}
              error={err.status}
              hint="Drafts are work in progress."
            />
            <TextAreaField name="description" label="Description" rows={2} defaultValue={v.description ?? pkg?.description} className="sm:col-span-2 lg:col-span-3" />
          </FormSection>

          <fieldset className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6">
            <legend className="sr-only">Lines</legend>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight" aria-hidden>
                  Services in this package <span className="text-destructive">*</span>
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Each line is a service at a tier for a number of hours per month.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, blankLine()])}>
                <Plus /> Add line
              </Button>
            </div>

            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_90px_minmax(0,1.2fr)_36px] gap-3 px-1 pb-2 text-xs font-medium text-muted-foreground md:grid">
              <span>Service</span>
              <span>Tier</span>
              <span>Hours</span>
              <span>Value · VA cost</span>
              <span />
            </div>
            <ul className="flex flex-col gap-3">
              {lines.map((l, i) => {
                const opt = optionById.get(l.service_id);
                const rate = l.service_id ? rates[l.service_id]?.[l.tier] : undefined;
                const hours = Number(l.hours);
                const valid = Number.isFinite(hours) && hours > 0;
                return (
                  <li key={l.key} className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/40 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_90px_minmax(0,1.2fr)_36px] md:items-center md:border-0 md:bg-transparent md:p-0 md:px-1">
                    <label className="col-span-2 md:col-span-1">
                      <span className="sr-only">Line {i + 1} service</span>
                      <select value={l.service_id} onChange={(e) => update(l.key, { service_id: e.target.value })} className={cn(fieldClass, "h-9")}>
                        <option value="">Choose a service…</option>
                        {groups.map((g) => (
                          <optgroup key={g} label={g}>
                            {options
                              .filter((o) => o.group === g && (o.active || o.id === l.service_id))
                              .map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                  {!o.active ? " (archived)" : ""}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Line {i + 1} tier</span>
                      <select value={l.tier} onChange={(e) => update(l.key, { tier: e.target.value as Tier })} className={cn(fieldClass, "h-9")}>
                        {TIERS.map((t) => (
                          <option key={t} value={t}>
                            {TIER_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Line {i + 1} hours per month</span>
                      <input
                        inputMode="decimal"
                        placeholder="hrs"
                        value={l.hours}
                        onChange={(e) => update(l.key, { hours: e.target.value })}
                        className={cn(fieldClass, "tabular h-9")}
                      />
                    </label>
                    <div className="col-span-2 flex flex-wrap items-center gap-1.5 text-xs md:col-span-1">
                      {!l.service_id ? (
                        <span className="text-muted-foreground">—</span>
                      ) : rate ? (
                        <>
                          <span className="tabular font-medium text-foreground">{valid ? usd(rate.client_rate * hours) : `${usd(rate.client_rate)}/hr`}</span>
                          <span className="tabular text-muted-foreground">· VA {valid ? usd(rate.va_rate * hours) : `${usd(rate.va_rate)}/hr`}</span>
                        </>
                      ) : (
                        <Badge variant="pending">Rate missing</Badge>
                      )}
                      {opt && !opt.active && <Badge variant="neutral">Archived</Badge>}
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="justify-self-end text-destructive hover:text-destructive"
                      aria-label={`Remove line ${i + 1}`}
                      disabled={lines.length === 1}
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
            {err.lines && (
              <p role="alert" className="mt-3 text-xs font-medium text-destructive">
                {err.lines}
              </p>
            )}
            {options.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                No priceable services yet. <Link href="/admin/services" className="font-medium text-primary hover:underline">Add services and rates</Link> first.
              </p>
            )}
          </fieldset>

          <FormSection title="Package amount" description="What the client pays per month, in USD.">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Monthly amount <span className="sr-only">(required)</span>
              <span className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  id="monthly_amount"
                  name="monthly_amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={Boolean(err.monthly_amount)}
                  className={cn(fieldClass, "tabular h-9 pl-6 font-normal")}
                />
              </span>
              {err.monthly_amount && <span className="text-xs font-medium text-destructive">{err.monthly_amount}</span>}
            </label>
            <TextAreaField name="notes" label="Internal notes" rows={2} defaultValue={v.notes ?? pkg?.notes} className="sm:col-span-2" />
          </FormSection>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Totals lines={lines} rates={rates} amount={Number(amount) || 0} onUseStandard={(n) => setAmount(String(Math.round(n * 100) / 100))} />
        </aside>
      </div>

      <FormActions>
        <Button asChild variant="secondary">
          <Link href="/admin/services/packages">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </FormActions>
    </form>
  );
}
