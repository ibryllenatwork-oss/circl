import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/badges";
import { EmptyState } from "@/components/admin/empty-state";
import { Initials } from "@/components/admin/preview-card";
import { TableSkeleton } from "@/components/admin/skeletons";
import { asList } from "@/components/admin/list-controls";
import { listEmployees } from "@/lib/employees/queries";
import { listClients } from "@/lib/clients/queries";
import { EMPLOYEE_STATUSES } from "@/lib/employees/labels";
import { CLIENT_STATUSES } from "@/lib/clients/labels";
import { searchTerm } from "@/lib/validation/action";

export const metadata = { title: "Search" };

const LIMIT = 5;

function ResultCard({
  title,
  icon: Icon,
  total,
  seeAll,
  children,
}: {
  title: string;
  icon: typeof Users;
  total: number;
  seeAll: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden /> {title}
          <span className="tabular text-sm font-normal text-muted-foreground">({total})</span>
        </CardTitle>
        {total > LIMIT && (
          <Link href={seeAll} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = asList((await searchParams).q)[0] ?? "";
  const q = searchTerm(raw);
  if (!q) {
    return (
      <Card>
        <EmptyState icon={Search} title="Search employees and clients" description="Type a name, employee no., email or company in the search bar above." />
      </Card>
    );
  }

  const [emps, clients] = await Promise.all([
    listEmployees({ q, statuses: [...EMPLOYEE_STATUSES] }),
    listClients({ q, statuses: [...CLIENT_STATUSES] }),
  ]);
  const all = (base: string, statuses: readonly string[]) =>
    `${base}?q=${encodeURIComponent(q)}&${statuses.map((s) => `status=${s}`).join("&")}`;

  if (emps.total === 0 && clients.total === 0) {
    return (
      <Card>
        <EmptyState icon={Search} title={`No results for “${raw}”`} description="Check the spelling, or search by employee no. or email." />
      </Card>
    );
  }

  const row = "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent";
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ResultCard title="Employees" icon={Users} total={emps.total} seeAll={all("/admin/employees", EMPLOYEE_STATUSES)}>
        {emps.rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No employees match.</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {emps.rows.slice(0, LIMIT).map((e) => (
              <li key={e.id}>
                <Link href={`/admin/employees/${e.id}`} className={row}>
                  <Initials name={`${e.first_name} ${e.last_name}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {e.last_name}, {e.first_name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.employee_no} · {e.position}
                    </span>
                  </span>
                  <StatusBadge status={e.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ResultCard>
      <ResultCard title="Clients" icon={Building2} total={clients.total} seeAll={all("/admin/clients", CLIENT_STATUSES)}>
        {clients.rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No clients match.</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {clients.rows.slice(0, LIMIT).map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clients/${c.id}`} className={row}>
                  <Initials name={c.company_name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.company_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.primary_contact ?? "No contact"}</span>
                  </span>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ResultCard>
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <PageHeader eyebrow="Search" title="Search results" description="Employees and clients in every status." />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}
