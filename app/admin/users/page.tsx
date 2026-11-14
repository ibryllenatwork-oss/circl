import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { requireManager, superadminEmails } from "@/lib/auth/require-manager";
import { isSuperadmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { TableCard, td, th } from "@/components/admin/data-table";
import { TableSkeleton } from "@/components/admin/skeletons";
import { InviteForm } from "@/components/admin/invite-form";
import { RemoveButton } from "@/components/admin/remove-button";
import { initialsOf } from "@/components/admin/user-menu";

export const metadata = { title: "Users" };

const manilaDateTime = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value?: string | null) {
  return value ? manilaDateTime.format(new Date(value)) : null;
}

async function ManagerTable() {
  const me = await requireManager();
  if (!me) redirect("/auth/login");
  if (!me.isSuperadmin) {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="Only a superadmin can manage users." description="Ask a superadmin if someone needs access." />
      </Card>
    );
  }
  const superadmins = superadminEmails();

  let users;
  try {
    const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;
    users = data.users;
  } catch (e) {
    const missingKey = e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY");
    return (
      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="Couldn't load managers"
          description={
            missingKey
              ? "The server is missing SUPABASE_SERVICE_ROLE_KEY, so managers can't be listed."
              : "Refresh the page to try again."
          }
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <InviteForm />
      <TableCard footer={<span className="text-[13px] text-muted-foreground">{users.length} {users.length === 1 ? "manager" : "managers"}</span>}>
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className={th}>Manager</th>
              <th scope="col" className={`${th} hidden md:table-cell`}>Invited</th>
              <th scope="col" className={th}>Last sign-in</th>
              <th scope="col" className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const superadmin = isSuperadmin(u.email, superadmins);
              const email = u.email ?? "";
              return (
                <tr key={u.id} className="border-t border-border/60 text-sm first:border-t-0">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-badge-brand-bg text-xs font-semibold text-badge-brand">
                        {initialsOf(email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {email}
                          {u.id === me.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">Invited {formatDateTime(u.invited_at ?? u.created_at)}</p>
                      </div>
                      {superadmin && <Badge variant="brand">Superadmin</Badge>}
                    </div>
                  </td>
                  <td className={`${td} hidden whitespace-nowrap text-muted-foreground md:table-cell`}>
                    {formatDateTime(u.invited_at ?? u.created_at)}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {u.last_sign_in_at ? (
                      <span className="text-muted-foreground">{formatDateTime(u.last_sign_in_at)}</span>
                    ) : (
                      <Badge variant="pending">Pending</Badge>
                    )}
                  </td>
                  <td className={`${td} w-10 text-right`}>
                    {u.id !== me.id && !superadmin && <RemoveButton userId={u.id} email={email} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

export default function UsersPage() {
  return (
    <>
      <PageHeader eyebrow="Access" title="Users" description="Everyone listed here can sign in to the circl. admin." />
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <ManagerTable />
      </Suspense>
    </>
  );
}
