"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/badges";
import { ConfirmDialog } from "@/components/admin/confirm-delete";
import { Initials } from "@/components/admin/preview-card";
import { toast } from "@/components/admin/toast";
import { assignEmployee, unassignEmployee } from "@/app/admin/clients/actions";
import type { AssignedVA } from "@/lib/clients/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Option = { id: string; employee_no: string; first_name: string; last_name: string; position: string };

export function AssignedVAs({ clientId, vas, options }: { clientId: string; vas: AssignedVA[]; options: Option[] }) {
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const available = options.filter((o) => !vas.some((v) => v.id === o.id));

  const assign = () =>
    startTransition(async () => {
      setError(null);
      const r = await assignEmployee(clientId, pick);
      if (!r.ok) setError(r.error ?? "Could not assign.");
      else {
        toast("VA assigned.");
        setPick("");
      }
    });

  return (
    <section className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6">
      <h2 className="mb-4 text-[15px] font-semibold tracking-tight">Assigned VAs</h2>
      {vas.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          No VAs assigned yet.
        </p>
      ) : (
        <ul className="mb-4 flex flex-col divide-y divide-border/70">
          {vas.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3 first:pt-0">
              <Initials name={`${v.first_name} ${v.last_name}`} />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/employees/${v.id}`} className="text-sm font-medium hover:text-primary">
                  {v.first_name} {v.last_name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {v.position} · since {formatDate(v.assigned_on)}
                </p>
              </div>
              {v.status !== "active" && <StatusBadge status={v.status} />}
              <ConfirmDialog
                trigger={
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${v.first_name} ${v.last_name}`}>
                    <UserMinus />
                  </Button>
                }
                title={`Remove ${v.first_name} ${v.last_name}?`}
                description="They will no longer be listed as assigned to this client. Their 201 file is not affected."
                confirmLabel="Remove"
                onConfirm={async () => {
                  const r = await unassignEmployee(clientId, v.id);
                  if (r.ok) toast("VA removed.");
                  return r;
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="assign-va" className="sr-only">
          VA to assign
        </label>
        <select id="assign-va" value={pick} onChange={(e) => setPick(e.target.value)} className={cn(fieldClass, "h-9 min-w-0 flex-1")}>
          <option value="">{available.length ? "Choose an active VA…" : "No more active VAs to assign"}</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.last_name}, {o.first_name} · {o.position} ({o.employee_no})
            </option>
          ))}
        </select>
        <Button disabled={!pick || busy} onClick={assign}>
          <UserPlus /> {busy ? "Assigning…" : "Assign"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
