"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fieldClass } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/admin/confirm-delete";
import { FormAlert } from "@/components/admin/form-fields";
import { toast } from "@/components/admin/toast";
import { clearRates, saveRates } from "@/app/admin/services/actions";
import { TIER_LABELS, TIERS, rateMargin, type RateTable } from "@/lib/services/pricing";
import { cn } from "@/lib/utils";
import { MarginChip } from "./money";

type Values = Record<string, string>;

function initial(rates: RateTable[string]): Values {
  const v: Values = {};
  for (const t of TIERS) {
    v[`${t}_client`] = rates[t] ? String(rates[t]!.client_rate) : "";
    v[`${t}_va`] = rates[t] ? String(rates[t]!.va_rate) : "";
  }
  return v;
}

export function RatesDialog({ serviceId, name, rates }: { serviceId: string; name: string; rates: RateTable[string] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveRates.bind(null, serviceId), null);
  const [values, setValues] = useState<Values>(() => initial(rates));
  const hasRates = Object.keys(rates).length > 0;

  useEffect(() => {
    if (state?.ok) {
      toast(state.message ?? "Rates saved.");
      setOpen(false);
    }
  }, [state]);

  const err = state && !state.ok ? state.fieldErrors ?? {} : {};
  const input = (name: string, label: string) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <span className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <input
          name={name}
          inputMode="decimal"
          value={values[name] ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          aria-invalid={Boolean(err[name])}
          placeholder="—"
          className={cn(fieldClass, "tabular h-9 pl-6 text-sm font-normal text-foreground")}
        />
      </span>
      {err[name] && <span className="font-medium text-destructive">{err[name]}</span>}
    </label>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setValues(initial(rates));
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Pencil /> Edit rates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Rates for {name}</DialogTitle>
          <DialogDescription>Hourly, in USD. Leave both boxes empty for a tier you don&apos;t offer.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4" noValidate>
          {state && !state.ok && state.error && <FormAlert message={state.error} />}
          {TIERS.map((t) => {
            const c = Number(values[`${t}_client`]);
            const a = Number(values[`${t}_va`]);
            const both = values[`${t}_client`] !== "" && values[`${t}_va`] !== "" && Number.isFinite(c) && Number.isFinite(a);
            const m = both ? rateMargin(c, a) : null;
            return (
              <fieldset key={t} className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[110px_1fr_1fr_auto] sm:items-end">
                <legend className="sr-only">{TIER_LABELS[t]}</legend>
                <span className="col-span-2 text-sm font-semibold sm:col-span-1 sm:pb-2" aria-hidden>
                  {TIER_LABELS[t]}
                </span>
                {input(`${t}_client`, "Client pays")}
                {input(`${t}_va`, "VA earns")}
                <span className="col-span-2 pb-1 sm:col-span-1 sm:pb-2">{m ? <MarginChip amount={m.amount} pct={m.pct} /> : null}</span>
              </fieldset>
            );
          })}
          <DialogFooter className="sm:justify-between">
            {hasRates ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
                    Clear all rates
                  </Button>
                }
                title={`Clear all rates for ${name}?`}
                description="All three tiers will be removed. Packages using this service will show missing rates until new ones are set."
                confirmLabel="Clear rates"
                onConfirm={async () => {
                  const r = await clearRates(serviceId);
                  if (r.ok) {
                    toast(r.message ?? "Rates cleared.");
                    setOpen(false);
                  }
                  return r;
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save rates"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
