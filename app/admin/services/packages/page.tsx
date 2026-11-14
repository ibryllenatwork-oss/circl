import Link from "next/link";
import { Suspense } from "react";
import { PackageOpen, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { TableSkeleton } from "@/components/admin/skeletons";
import { SortHeader, TableCard, td, th, withParams, type Params } from "@/components/admin/data-table";
import { asList } from "@/components/admin/list-controls";
import { ServicesTabs } from "@/components/services/services-tabs";
import { PackageActions } from "@/components/services/package-actions";
import { MarginChip, usd } from "@/components/services/money";
import { listPackages, type PackageSort, type PackageStatusFilter } from "@/lib/services/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Packages" };

const BASE = "/admin/services/packages";
type SearchParams = Promise<Params>;

async function PackagesView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = asList(params.q)[0] ?? "";
  const rawStatus = asList(params.status)[0];
  const status: PackageStatusFilter = rawStatus === "archived" || rawStatus === "all" ? rawStatus : "active";
  const sortKey = asList(params.sort)[0] === "amount" ? "amount" : "name";
  const dir = asList(params.dir)[0] === "desc" ? "desc" : "asc";
  const sort: PackageSort = { key: sortKey, dir };
  const rows = await listPackages({ q, status, sort });
  const sh = { current: { key: sortKey, dir }, basePath: BASE, params } as const;

  const chip = (value: PackageStatusFilter, label: string) => (
    <Link
      href={withParams(BASE, params, { status: value === "active" ? undefined : value })}
      aria-current={status === value ? "true" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-[13px] transition-colors hover:border-primary/40",
        status === value ? "border-primary/30 bg-accent font-medium text-primary" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <TableCard
      toolbar={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form action={BASE} method="get" className="relative w-full lg:max-w-xs">
            {status !== "active" && <input type="hidden" name="status" value={status} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="pkg-q" className="sr-only">
              Search packages
            </label>
            <input id="pkg-q" name="q" type="search" defaultValue={q} placeholder="Package name" className={cn(fieldClass, "h-9 pl-9")} />
          </form>
          <div className="flex flex-wrap gap-2">
            {chip("active", "Active")}
            {chip("archived", "Archived")}
            {chip("all", "All")}
          </div>
        </div>
      }
      footer={<span className="text-[13px] text-muted-foreground">{rows.length} {rows.length === 1 ? "package" : "packages"}</span>}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={q || status !== "active" ? "No packages match" : "No packages yet"}
          description={q || status !== "active" ? "Try another search or status." : "Bundle services at a tier and hours, then set the monthly amount."}
          action={
            <Button asChild size="sm">
              <Link href={`${BASE}/new`}>
                <Plus /> Build a package
              </Link>
            </Button>
          }
        />
      ) : (
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <SortHeader label="Package" sortKey="name" {...sh} />
              <th scope="col" className={`${th} hidden text-right sm:table-cell`}>
                Hours / mo
              </th>
              <SortHeader label="Amount / mo" sortKey="amount" {...sh} className="text-right" />
              <th scope="col" className={`${th} hidden md:table-cell`}>
                Margin
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border/60 text-sm first:border-t-0 hover:bg-accent/50">
                <td className={`${td} w-full max-w-0`}>
                  <Link href={`${BASE}/${p.id}`} className="block truncate font-medium hover:text-primary">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {p.lineCount} line{p.lineCount === 1 ? "" : "s"}
                    </span>
                    {!p.active && <Badge variant="neutral">Archived</Badge>}
                    {p.totals.missingRates > 0 && <Badge variant="pending">Incomplete</Badge>}
                    {p.needsReview && <Badge variant="pending">Needs review</Badge>}
                  </div>
                </td>
                <td className={`${td} tabular hidden text-right text-muted-foreground sm:table-cell`}>
                  {p.totals.hours.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                </td>
                <td className={`${td} tabular whitespace-nowrap text-right font-medium`}>{usd(p.monthly_amount)}</td>
                <td className={`${td} hidden md:table-cell`}>
                  <MarginChip amount={p.totals.margin} pct={p.totals.marginPct} />
                </td>
                <td className={`${td} w-10 text-right`}>
                  <PackageActions id={p.id} name={p.name} active={p.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

export default function PackagesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Services & Rates"
        description="Reusable service packages with a monthly amount and live margins."
        actions={
          <Button asChild>
            <Link href={`${BASE}/new`}>
              <Plus /> Build a package
            </Link>
          </Button>
        }
      />
      <ServicesTabs active="packages" />
      <Suspense fallback={<TableSkeleton />}>
        <PackagesView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
