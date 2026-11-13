import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireManager } from "@/lib/auth/require-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteForm } from "@/components/admin/invite-form";
import { RemoveButton } from "@/components/admin/remove-button";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : null;
}

async function ManagerTable() {
  const me = await requireManager();
  if (!me) redirect("/auth/login");

  let users;
  try {
    const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;
    users = data.users;
  } catch (e) {
    const missingKey = e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY");
    return (
      <p className="text-sm text-red-500">
        {missingKey
          ? "The server is missing SUPABASE_SERVICE_ROLE_KEY, so managers can't be listed."
          : "Could not load managers. Refresh to try again."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Invited</th>
            <th className="p-3 font-medium">Last sign-in</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3">
                {u.email}
                {u.id === me.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
              </td>
              <td className="p-3">{formatDate(u.invited_at ?? u.created_at)}</td>
              <td className="p-3">{formatDate(u.last_sign_in_at) ?? "Pending"}</td>
              <td className="p-3 text-right">
                {u.id !== me.id && <RemoveButton userId={u.id} email={u.email ?? ""} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Everyone listed here can sign in to the circl. admin.
        </p>
      </div>
      <InviteForm />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading managers...</p>}>
        <ManagerTable />
      </Suspense>
    </div>
  );
}
