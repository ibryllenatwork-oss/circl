import Link from "next/link";
import { LABELS } from "@/lib/employees/labels";

/** Plain GET form: works without JavaScript and keeps filters in the URL. */
export function ListFilters({
  action,
  q,
  statuses,
  selected,
  devOnly,
  placeholder,
}: {
  action: string;
  q: string;
  statuses: readonly string[];
  selected: string[];
  devOnly: boolean;
  placeholder: string;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        />
      </div>
      <fieldset className="flex flex-wrap items-center gap-3 text-sm">
        <legend className="sr-only">Status</legend>
        {statuses.map((s) => (
          <label key={s} className="flex items-center gap-1.5">
            <input type="checkbox" name="status" value={s} defaultChecked={selected.includes(s)} />
            {LABELS[s] ?? s}
          </label>
        ))}
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <input type="checkbox" name="dev" value="1" defaultChecked={devOnly} />
          Created in dev mode
        </label>
      </fieldset>
      <button type="submit" className="h-9 rounded-md border px-3 text-sm hover:bg-accent">
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
  params: Record<string, string | string[] | undefined>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || v == null) continue;
      for (const item of Array.isArray(v) ? v : [v]) sp.append(k, item);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} {total === 1 ? "record" : "records"}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? <Link href={href(page - 1)} className="underline">Previous</Link> : <span>Previous</span>}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={href(page + 1)} className="underline">Next</Link> : <span>Next</span>}
        </div>
      )}
    </div>
  );
}

/** Normalizes Next's searchParams value (string | string[]) into a list. */
export function asList(v: string | string[] | undefined): string[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
