import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Params = Record<string, string | string[] | undefined>;

/** Rebuilds a query string from the current params with some keys changed (undefined removes). */
export function withParams(basePath: string, params: Params, changes: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k in changes || v == null) continue;
    for (const item of Array.isArray(v) ? v : [v]) sp.append(k, item);
  }
  for (const [k, v] of Object.entries(changes)) if (v != null) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function TableCard({ toolbar, children, footer }: { toolbar?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-card dark:border-border dark:shadow-none">
      {toolbar && <div className="border-b border-border/70 p-4 sm:px-5">{toolbar}</div>}
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="border-t border-border/70 px-4 py-3 sm:px-5">{footer}</div>}
    </div>
  );
}

export const th = "h-11 whitespace-nowrap px-4 text-left text-xs font-medium text-muted-foreground first:pl-5 last:pr-5";
export const td = "px-4 py-3.5 align-middle first:pl-5 last:pr-5";

/** Column header that links to the same list sorted by `sortKey` (toggling direction). */
export function SortHeader({
  label,
  sortKey,
  current,
  basePath,
  params,
  className,
}: {
  label: string;
  sortKey: string;
  current: { key: string; dir: "asc" | "desc" };
  basePath: string;
  params: Params;
  className?: string;
}) {
  const active = current.key === sortKey;
  const nextDir = active && current.dir === "asc" ? "desc" : "asc";
  const Icon = !active ? ArrowUpDown : current.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (current.dir === "asc" ? "ascending" : "descending") : "none"} className={cn(th, className)}>
      <Link
        href={withParams(basePath, params, { sort: sortKey, dir: nextDir, page: undefined, view: undefined })}
        scroll={false}
        className={cn("inline-flex items-center gap-1 rounded hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} aria-hidden />
      </Link>
    </th>
  );
}
