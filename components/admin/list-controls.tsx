import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { LABELS } from "@/lib/employees/labels";
import { fieldClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { withParams, type Params } from "./data-table";

/** Plain GET form: works without JavaScript and keeps filters (and sort) in the URL. */
export function ListFilters({
  action,
  q,
  statuses,
  selected,
  devOnly,
  placeholder,
  sort,
}: {
  action: string;
  q: string;
  statuses: readonly string[];
  selected: string[];
  devOnly: boolean;
  placeholder: string;
  sort?: { key: string; dir: string };
}) {
  const chip =
    "inline-flex h-8 cursor-pointer select-none items-center rounded-full border border-border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 has-[:checked]:border-primary/30 has-[:checked]:bg-accent has-[:checked]:font-medium has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";
  return (
    <form action={action} method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {sort && (
        <>
          <input type="hidden" name="sort" value={sort.key} />
          <input type="hidden" name="dir" value={sort.dir} />
        </>
      )}
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="list-q" className="sr-only">
          Search
        </label>
        <input id="list-q" name="q" type="search" defaultValue={q} placeholder={placeholder} className={cn(fieldClass, "h-9 pl-9")} />
      </div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Status</legend>
        {statuses.map((s) => (
          <label key={s} className={chip}>
            <input type="checkbox" name="status" value={s} defaultChecked={selected.includes(s)} className="sr-only" />
            {LABELS[s] ?? s}
          </label>
        ))}
        <label className={cn(chip, "border-dashed")}>
          <input type="checkbox" name="dev" value="1" defaultChecked={devOnly} className="sr-only" />
          Dev mode only
        </label>
      </fieldset>
      <button
        type="submit"
        className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 lg:ml-auto"
      >
        Apply
      </button>
    </form>
  );
}

export function Pagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: Params;
  page: number;
  total: number;
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pastEnd = total > 0 && page > pages;
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  const summary = total === 0 ? "No records" : pastEnd ? `Showing 0 of ${total}` : `Showing ${from}–${to} of ${total}`;
  const btn =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium transition-colors hover:bg-accent";
  const off = "cursor-not-allowed opacity-40 hover:bg-card";
  const href = (p: number) => withParams(basePath, params, { page: p > 1 ? String(p) : undefined, view: undefined });
  // Disabled steps are plain text, so neither mouse nor keyboard can follow them.
  const step = (enabled: boolean, target: number, children: React.ReactNode) =>
    enabled ? (
      <Link href={href(target)} className={btn}>
        {children}
      </Link>
    ) : (
      <span className={cn(btn, off)} aria-disabled="true">
        {children}
      </span>
    );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
      <span className="tabular">{summary}</span>
      {(pages > 1 || pastEnd) && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          {step(page > 1, Math.min(page - 1, pages), [<ChevronLeft key="i" className="h-4 w-4" />, "Previous"])}
          <span className="tabular px-1">
            {Math.min(page, pages)} / {pages}
          </span>
          {step(page < pages, page + 1, ["Next", <ChevronRight key="i" className="h-4 w-4" />])}
        </nav>
      )}
    </div>
  );
}

/** Normalizes Next's searchParams value (string | string[]) into a list. */
export function asList(v: string | string[] | undefined): string[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
