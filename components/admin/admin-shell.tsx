import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth/require-manager";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";
import { AppSidebar, SIDEBAR_COOKIE } from "./app-sidebar";
import { AdminHeader } from "./admin-header";
import { SavedToast, Toaster } from "./toast";
import { Suspense } from "react";

/**
 * Verifies the session with Supabase Auth (getUser, not just the JWT) before
 * rendering any admin page, so a removed manager is locked out on their next
 * request rather than when their access token expires. Then lays out the
 * sidebar, header and page.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const me = await requireManager();
  if (!me) redirect("/auth/login");

  const devMode = me.id === DEV_MANAGER.id;
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";
  const role = devMode ? "Dev mode · superadmin" : me.isSuperadmin ? "Superadmin" : "Manager";

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar isSuperadmin={me.isSuperadmin} devMode={devMode} initialCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader email={me.email} role={role} devMode={devMode} isSuperadmin={me.isSuperadmin} />
        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <Toaster />
      <Suspense>
        <SavedToast />
      </Suspense>
    </div>
  );
}
