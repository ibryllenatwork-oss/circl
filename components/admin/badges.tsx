import { Badge } from "@/components/ui/badge";
import { LABELS } from "@/lib/employees/labels";
import { expiryTone, statusTone } from "@/lib/admin/status";
import type { ExpiryState } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusTone(status)} dot>
      {LABELS[status] ?? status}
    </Badge>
  );
}

export function DevBadge() {
  return (
    <Badge
      variant="outline"
      title="Created in dev mode"
      className="ml-2 border-dashed px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
    >
      Dev
    </Badge>
  );
}

export function ExpiryBadge({ state, date }: { state: ExpiryState; date: string }) {
  if (state === "none") return null;
  const text = state === "expired" ? `Expired ${date}` : state === "soon" ? `Expires ${date}` : `Valid until ${date}`;
  return <Badge variant={expiryTone(state)}>{text}</Badge>;
}
