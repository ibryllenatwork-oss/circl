import Link from "next/link";
import { ArrowUpRight, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PreviewCard({
  title,
  subtitle,
  avatar,
  badges,
  href,
  closeHref,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  badges?: React.ReactNode;
  href: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden" aria-label={`Preview of ${title}`}>
      <div className="relative bg-gradient-to-br from-accent to-card px-5 pb-4 pt-5">
        <Link
          href={closeHref}
          scroll={false}
          aria-label="Close preview"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3 pr-6">
          {avatar}
          <div className="min-w-0">
            <p className="truncate font-semibold">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
      <dl className="flex flex-col gap-3 px-5 py-4 text-sm">{children}</dl>
      <div className="flex gap-2 border-t border-border/70 px-5 py-4">
        <Button asChild size="sm" className="flex-1">
          <Link href={href}>
            Open <ArrowUpRight />
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="flex-1">
          <Link href={`${href}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{children || "—"}</dd>
    </div>
  );
}

export function Initials({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={
        size === "lg"
          ? "flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-magenta text-lg font-semibold text-primary-foreground"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-magenta text-sm font-semibold text-primary-foreground"
      }
      aria-hidden
    >
      {initials}
    </span>
  );
}
