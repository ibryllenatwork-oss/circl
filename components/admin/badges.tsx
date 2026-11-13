import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/employees/labels";
import type { ExpiryState } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  active: "border-green-600/40 text-green-700 dark:text-green-400",
  on_leave: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  prospect: "border-sky-500/50 text-sky-700 dark:text-sky-400",
  paused: "border-amber-500/50 text-amber-700 dark:text-amber-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs",
        STATUS_STYLES[status] ?? "text-muted-foreground",
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

export function DevBadge() {
  return (
    <span title="Created in dev mode" className="ml-2 rounded border border-dashed px-1 text-[10px] uppercase text-muted-foreground">
      Dev
    </span>
  );
}

export function ExpiryBadge({ state, date }: { state: ExpiryState; date: string }) {
  if (state === "none") return null;
  const text = state === "expired" ? `Expired ${date}` : state === "soon" ? `Expires ${date}` : `Valid until ${date}`;
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs",
        state === "expired" && "border-red-500/60 text-red-600",
        state === "soon" && "border-amber-500/60 text-amber-700 dark:text-amber-400",
        state === "ok" && "text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
}
