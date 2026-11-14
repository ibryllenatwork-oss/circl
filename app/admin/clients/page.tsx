import Link from "next/link";
import { Suspense } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, WithAside } from "@/components/admin/page-header";
import { ListFilters, Pagination, asList } from "@/components/admin/list-controls";
import { SortHeader, TableCard, td, th, withParams, type Params } from "@/components/admin/data-table";
import { SelectableRow } from "@/components/admin/row-link";
import { RowActions } from "@/components/admin/row-actions";
import { EmptyState } from "@/components/admin/empty-state";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { Initials, PreviewCard, PreviewRow } from "@/components/admin/preview-card";
import { TableSkeleton } from "@/components/admin/skeletons";
import { CLIENT_PAGE_SIZE, getClient, listClients, parseClientStatuses } from "@/lib/clients/queries";
import { CLIENT_STATUSES } from "@/lib/clients/labels";
import { CLIENT_SORT, parseSort } from "@/lib/admin/sort";
import { pageNumber } from "@/lib/validation/action";
import { expiryState, formatDate, formatMoney } from "@/lib/format";
import { label } from "@/lib/employees/labels";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";

type SearchParams = Promise<Params>;
const BASE = "/admin/clients";

async function ClientPreview({ id, params }: { id: string; params: Params }) {
  const c = await getClient(id);
  if (!c) return null;
  const primary = c.contacts.find((p) => p.is_primary) ?? c.contacts[0];
  return (
    <PreviewCard
      title={c.company_name}
      subtitle={[c.industry, c.country].filter(Boolean).join(" · ") || undefined}
      avatar={<Initials name={c.company_name} />}
      badges={
        <>
          <StatusBadge status={c.status} />
          {c.contract_end && <ExpiryBadge state={expiryState(c.contract_end)} date={formatDate(c.contract_end)} />}
        </>
      }
      href={`${BASE}/${c.id}`}
      closeHref={withParams(BASE, params, { view: undefined })}
    >
      <PreviewRow label="Primary contact">{primary?.name}</PreviewRow>
      {primary?.email && (
        <PreviewRow label="Email">
          <span className="break-all">{primary.email}</span>
        </PreviewRow>
      )}
      <PreviewRow label="Rate">
        {c.rate != null ? `${formatMoney(c.rate, c.currency)}${c.rate_basis ? ` / ${c.rate_basis === "hourly" ? "hr" : "mo"}` : ""}` : null}
      </PreviewRow>
      <PreviewRow label="Billing">{c.billing_cycle ? label(c.billing_cycle) : null}</PreviewRow>
      <PreviewRow label="Hours / week">{c.hours_per_week != null ? String(c.hours_per_week) : null}</PreviewRow>
      <PreviewRow label="VAs">{c.vas.map((v) => `${v.first_name} ${v.last_name}`).join(", ")}</PreviewRow>
    </PreviewCard>
  );
}

async function ClientsView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = asList(params.q)[0] ?? "";
  const statuses = parseClientStatuses(asList(params.status).join(","));
  const devOnly = asList(params.dev)[0] === "1";
  const page = pageNumber(asList(params.page)[0]);
  const sort = parseSort({ sort: asList(params.sort)[0], dir: asList(params.dir)[0] }, CLIENT_SORT);
  const view = asList(params.view)[0];
  const { rows, total } = await listClients({ q, statuses, devOnly, page, order: sort.order });
  const filtered = Boolean(q) || devOnly || asList(params.status).length > 0;
  const sh = { current: sort, basePath: BASE, params };

  const table = (
    <TableCard
      toolbar={
        <ListFilters
          action={BASE}
          q={q}
          statuses={CLIENT_STATUSES}
          selected={statuses}
          devOnly={devOnly}
          placeholder="Company or contact name"
          sort={{ key: sort.key, dir: sort.dir }}
        />
      }
      footer={<Pagination basePath={BASE} params={params} page={page} total={total} pageSize={CLIENT_PAGE_SIZE} />}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={filtered ? "No clients match your filters" : "No clients yet"}
          description={filtered ? "Try a different search or status." : "Add your first client to start assigning VAs."}
          action={
            <Button asChild size="sm">
              <Link href={`${BASE}/new`}>
                <Plus /> Add client
              </Link>
            </Button>
          }
        />
      ) : (
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <SortHeader label="Company" sortKey="company" {...sh} />
              <SortHeader label="Status" sortKey="status" {...sh} />
              <th scope="col" className={`${th} hidden md:table-cell`}>
                Primary contact
              </th>
              <th scope="col" className={`${th} hidden text-right lg:table-cell`}>
                VAs
              </th>
              <SortHeader label="Contract ends" sortKey="contract_end" {...sh} className="hidden sm:table-cell" />
              <th scope="col" className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <SelectableRow
                key={c.id}
                href={`${BASE}/${c.id}`}
                previewHref={withParams(BASE, params, { view: c.id })}
                selected={view === c.id}
                label={c.company_name}
              >
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Initials name={c.company_name} />
                    <div className="min-w-0">
                      <Link href={`${BASE}/${c.id}`} className="font-medium text-foreground hover:text-primary">
                        {c.company_name}
                      </Link>
                      {c.created_by === DEV_MANAGER.email && <DevBadge />}
                      <p className="truncate text-xs text-muted-foreground md:hidden">{c.primary_contact ?? "No contact"}</p>
                    </div>
                  </div>
                </td>
                <td className={td}>
                  <StatusBadge status={c.status} />
                </td>
                <td className={`${td} hidden text-muted-foreground md:table-cell`}>{c.primary_contact ?? "—"}</td>
                <td className={`${td} tabular hidden text-right lg:table-cell`}>{c.va_count}</td>
                <td className={`${td} hidden whitespace-nowrap text-muted-foreground sm:table-cell`}>{formatDate(c.contract_end)}</td>
                <td className={`${td} w-10 text-right`}>
                  <RowActions href={`${BASE}/${c.id}`} label={c.company_name} />
                </td>
              </SelectableRow>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );

  const aside = view ? (
    <Suspense key={view} fallback={<Skeleton className="h-80 rounded-xl" />}>
      <ClientPreview id={view} params={params} />
    </Suspense>
  ) : null;

  return <WithAside aside={aside}>{table}</WithAside>;
}

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Clients"
        description="Companies circl. supports, their contacts and assigned VAs."
        actions={
          <Button asChild>
            <Link href={`${BASE}/new`}>
              <Plus /> Add client
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ClientsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
