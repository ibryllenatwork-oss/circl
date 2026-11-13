import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth/require-manager";
import { Sidebar } from "./sidebar";

/**
 * Verifies the session with Supabase Auth (getUser, not just the JWT) before
 * rendering any admin page, so a removed manager is locked out on their next
 * request rather than when their access token expires. Also tells the sidebar
 * whether to show superadmin-only items.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const me = await requireManager();
  if (!me) redirect("/auth/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar isSuperadmin={me.isSuperadmin} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
