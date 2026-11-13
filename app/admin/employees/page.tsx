import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ListFilters, Pagination, asList } from "@/components/admin/list-controls";
import { pageNumber } from "@/lib/validation/action";
import { StatusBadge, DevBadge } from "@/components/admin/badges";
import { listEmployees, PAGE_SIZE, parseStatuses } from "@/lib/employees/queries";
import { EMPLOYEE_STATUSES } from "@/lib/employees/labels";
import { formatDate } from "@/lib/format";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function EmployeeTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = asList(params.q)[0] ?? "";
  const statuses = parseStatuses(asList(params.status).join(","));
  const devOnly = asList(params.dev)[0] === "1";
  const page = pageNumber(asList(params.page)[0]);
  const { rows, total } = await listEmployees({ q, statuses, devOnly, page });

  return (
    <div className="flex flex-col gap-4">
      <ListFilters
        action="/admin/employees"
        q={q}
        statuses={EMPLOYEE_STATUSES}
        selected={statuses}
        devOnly={devOnly}
        placeholder="Name, employee no. or email"
      />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">No.</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Position</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Hired</th>
              <th className="p-3 font-medium">Clients</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No employees match. Try other filters, or add one.
                </td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className="border-t hover:bg-accent/40">
                <td className="p-3 font-mono text-xs">{e.employee_no}</td>
                <td className="p-3">
                  <Link href={`/admin/employees/${e.id}`} className="font-medium underline-offset-4 hover:underline">
                    {e.last_name}, {e.first_name}
                  </Link>
                  {e.nickname && <span className="text-muted-foreground"> ({e.nickname})</span>}
                  {e.created_by === DEV_MANAGER.email && <DevBadge />}
                </td>
                <td className="p-3">{e.position}</td>
                <td className="p-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="whitespace-nowrap p-3">{formatDate(e.date_hired)}</td>
                <td className="p-3">{e.clients.map((c) => c.company_name).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/employees" params={params} page={page} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}

export default function EmployeesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-muted-foreground">201 files of circl. virtual assistants.</p>
        </div>
        <Button asChild>
          <Link href="/admin/employees/new">Add employee</Link>
        </Button>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading employees...</p>}>
        <EmployeeTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
