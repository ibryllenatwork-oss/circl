"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/badges";
import { assignEmployee, unassignEmployee } from "@/app/admin/clients/actions";
import type { AssignedVA } from "@/lib/clients/queries";
import { formatDate } from "@/lib/format";

type Option = { id: string; employee_no: string; first_name: string; last_name: string; position: string };

export function AssignedVAs({ clientId, vas, options }: { clientId: string; vas: AssignedVA[]; options: Option[] }) {
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const available = options.filter((o) => !vas.some((v) => v.id === o.id));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else setPick("");
    });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">Assigned VAs</h2>
      {vas.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">No VAs assigned yet.</p>
      ) : (
        <ul className="mb-3 divide-y rounded-md border text-sm">
          {vas.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span>
                <Link href={`/admin/employees/${v.id}`} className="font-medium underline-offset-4 hover:underline">
                  {v.first_name} {v.last_name}
                </Link>{" "}
                <span className="text-muted-foreground">· {v.position} · since {formatDate(v.assigned_on)}</span>{" "}
                {v.status !== "active" && <StatusBadge status={v.status} />}
              </span>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => unassignEmployee(clientId, v.id))}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="assign-va" className="sr-only">VA to assign</label>
        <select
          id="assign-va"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="h-9 min-w-64 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">{available.length ? "Choose an active VA..." : "No more active VAs to assign"}</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.last_name}, {o.first_name} · {o.position} ({o.employee_no})
            </option>
          ))}
        </select>
        <Button size="sm" disabled={!pick || busy} onClick={() => run(() => assignEmployee(clientId, pick))}>
          Assign
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    </section>
  );
}
