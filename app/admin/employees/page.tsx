import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, WithAside } from "@/components/admin/page-header";
import { ListFilters, Pagination, asList } from "@/components/admin/list-controls";
import { SortHeader, TableCard, td, th, withParams, type Params } from "@/components/admin/data-table";
import { SelectableRow } from "@/components/admin/row-link";
import { RowActions } from "@/components/admin/row-actions";
import { EmptyState } from "@/components/admin/empty-state";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { Initials, PreviewCard, PreviewRow } from "@/components/admin/preview-card";
import { TableSkeleton } from "@/components/admin/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployee, listEmployees, PAGE_SIZE, parseStatuses } from "@/lib/employees/queries";
import { EMPLOYEE_STATUSES, label } from "@/lib/employees/labels";
import { EMPLOYEE_SORT, parseSort } from "@/lib/admin/sort";
import { pageNumber } from "@/lib/validation/action";
import { expiryState, formatDate, fullName, latestExpiry } from "@/lib/format";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";

type SearchParams = Promise<Params>;
const BASE = "/admin/employees";

async function EmployeePreview({ id, params }: { id: string; params: Params }) {
  const e = await getEmployee(id);
  if (!e) return null;
  const nbi = latestExpiry(e.documents, "nbi_clearance");
  return (
    <PreviewCard
      title={fullName(e)}
      subtitle={`${e.employee_no} · ${e.position}`}
      avatar={<Initials name={`${e.first_name} ${e.last_name}`} />}
      badges={
        <>
          <StatusBadge status={e.status} />
          {nbi && <ExpiryBadge state={expiryState(nbi)} date={formatDate(nbi)} />}
        </>
      }
      href={`${BASE}/${e.id}`}
      closeHref={withParams(BASE, params, { view: undefined })}
    >
      <PreviewRow label="Type">{label(e.employment_type)}</PreviewRow>
      <PreviewRow label="Hired">{formatDate(e.date_hired)}</PreviewRow>
      <PreviewRow label="Schedule">{e.work_schedule}</PreviewRow>
      <PreviewRow label="Email">
        <span className="break-all">{e.personal_email}</span>
      </PreviewRow>
      <PreviewRow label="Mobile">{e.mobile}</PreviewRow>
      <PreviewRow label="Clients">{e.clients.map((c) => c.company_name).join(", ")}</PreviewRow>
      {!nbi && <PreviewRow label="NBI">Not on file</PreviewRow>}
    </PreviewCard>
  );
}

async function EmployeesView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = asList(params.q)[0] ?? "";
  const statuses = parseStatuses(asList(params.status).join(","));
  const devOnly = asList(params.dev)[0] === "1";
  const page = pageNumber(asList(params.page)[0]);
  const sort = parseSort({ sort: asList(params.sort)[0], dir: asList(params.dir)[0] }, EMPLOYEE_SORT);
  const view = asList(params.view)[0];
  const { rows, total } = await listEmployees({ q, statuses, devOnly, page, order: sort.order });
  const filtered = Boolean(q) || devOnly || asList(params.status).length > 0;
  const sh = { current: sort, basePath: BASE, params };

  const table = (
    <TableCard
      toolbar={
        <ListFilters
          action={BASE}
          q={q}
          statuses={EMPLOYEE_STATUSES}
          selected={statuses}
          devOnly={devOnly}
          placeholder="Name, employee no. or email"
          sort={{ key: sort.key, dir: sort.dir }}
        />
      }
      footer={<Pagination basePath={BASE} params={params} page={page} total={total} pageSize={PAGE_SIZE} />}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? "No employees match your filters" : "No employees yet"}
          description={filtered ? "Try a different search or status." : "Add your first VA's 201 file to get started."}
          action={
            <Button asChild size="sm">
              <Link href={`${BASE}/new`}>
                <Plus /> Add employee
              </Link>
            </Button>
          }
        />
      ) : (
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <SortHeader label="Name" sortKey="name" {...sh} />
              <SortHeader label="No." sortKey="no" {...sh} className={view ? "hidden 2xl:table-cell" : "hidden md:table-cell"} />
              <SortHeader label="Position" sortKey="position" {...sh} className="hidden lg:table-cell" />
              <SortHeader label="Status" sortKey="status" {...sh} />
              <SortHeader label="Hired" sortKey="hired" {...sh} className="hidden sm:table-cell" />
              <th scope="col" className={`${th} hidden 2xl:table-cell`}>
                Clients
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const name = `${e.first_name} ${e.last_name}`;
              return (
                <SelectableRow
                  key={e.id}
                  href={`${BASE}/${e.id}`}
                  previewHref={withParams(BASE, params, { view: e.id })}
                  selected={view === e.id}
                  label={name}
                >
                  <td className={`${td} w-full max-w-0`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="hidden sm:contents"><Initials name={name} /></span>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex min-w-0 items-center">
                          <Link href={`${BASE}/${e.id}`} className="truncate font-medium text-foreground hover:text-primary">
                            {e.last_name}, {e.first_name}
                            {e.nickname && <span className="font-normal text-muted-foreground"> ({e.nickname})</span>}
                          </Link>
                          {e.created_by === DEV_MANAGER.email && <span className="hidden sm:inline"><DevBadge /></span>}
                        </span>
                        <p className="truncate text-xs text-muted-foreground lg:hidden">
                          {e.position}
                          <span className="md:hidden"> · {e.employee_no}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} tabular hidden whitespace-nowrap font-mono text-xs text-muted-foreground ${view ? "2xl:table-cell" : "md:table-cell"}`}>{e.employee_no}</td>
                  <td className={`${td} hidden lg:table-cell`}>{e.position}</td>
                  <td className={td}>
                    <StatusBadge status={e.status} />
                  </td>
                  <td className={`${td} hidden whitespace-nowrap text-muted-foreground sm:table-cell`}>{formatDate(e.date_hired)}</td>
                  <td className={`${td} hidden max-w-56 truncate text-muted-foreground 2xl:table-cell`}>
                    {e.clients.map((c) => c.company_name).join(", ") || "—"}
                  </td>
                  <td className={`${td} w-10 text-right`}>
                    <RowActions href={`${BASE}/${e.id}`} label={name} copy={{ text: e.employee_no, what: "Employee no." }} />
                  </td>
                </SelectableRow>
              );
            })}
          </tbody>
        </table>
      )}
    </TableCard>
  );

  const aside = view ? (
    <Suspense key={view} fallback={<Skeleton className="h-80 rounded-xl" />}>
      <EmployeePreview id={view} params={params} />
    </Suspense>
  ) : null;

  return <WithAside aside={aside}>{table}</WithAside>;
}

export default function EmployeesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Employees"
        description="201 files of circl. virtual assistants."
        actions={
          <Button asChild>
            <Link href={`${BASE}/new`}>
              <Plus /> Add employee
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <EmployeesView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
