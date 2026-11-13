import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ListFilters, Pagination, asList } from "@/components/admin/list-controls";
import { pageNumber } from "@/lib/validation/action";
import { DevBadge, StatusBadge } from "@/components/admin/badges";
import { CLIENT_PAGE_SIZE, listClients, parseClientStatuses } from "@/lib/clients/queries";
import { CLIENT_STATUSES } from "@/lib/clients/labels";
import { formatDate } from "@/lib/format";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ClientTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = asList(params.q)[0] ?? "";
  const statuses = parseClientStatuses(asList(params.status).join(","));
  const devOnly = asList(params.dev)[0] === "1";
  const page = pageNumber(asList(params.page)[0]);
  const { rows, total } = await listClients({ q, statuses, devOnly, page });

  return (
    <div className="flex flex-col gap-4">
      <ListFilters action="/admin/clients" q={q} statuses={CLIENT_STATUSES} selected={statuses} devOnly={devOnly} placeholder="Company or contact name" />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Company</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Primary contact</th>
              <th className="p-3 font-medium">VAs</th>
              <th className="p-3 font-medium">Contract ends</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No clients match. Try other filters, or add one.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t hover:bg-accent/40">
                <td className="p-3">
                  <Link href={`/admin/clients/${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.company_name}</Link>
                  {c.created_by === DEV_MANAGER.email && <DevBadge />}
                </td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3">{c.primary_contact ?? "—"}</td>
                <td className="p-3">{c.va_count}</td>
                <td className="whitespace-nowrap p-3">{formatDate(c.contract_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/clients" params={params} page={page} total={total} pageSize={CLIENT_PAGE_SIZE} />
    </div>
  );
}

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">Companies circl. supports, their contacts and assigned VAs.</p>
        </div>
        <Button asChild><Link href="/admin/clients/new">Add client</Link></Button>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading clients...</p>}>
        <ClientTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
