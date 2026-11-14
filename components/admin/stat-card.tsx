import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TINTS = {
  violet: "bg-badge-brand-bg text-badge-brand",
  green: "bg-badge-success-bg text-badge-success",
  yellow: "bg-badge-pending-bg text-badge-pending",
  blue: "bg-badge-processing-bg text-badge-processing",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tint = "violet",
  href,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tint?: keyof typeof TINTS;
  href?: string;
  hint?: string;
}) {
  const body = (
    <Card className={cn("flex h-full items-start justify-between gap-4 p-5", href && "transition-shadow hover:shadow-pop")}>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <p className="tabular mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", TINTS[tint])}>
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}
