import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Building2, ChevronRight, Plane, Sparkles, UserPlus, Users, UserRoundPlus, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, WithAside } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { CardsSkeleton } from "@/components/admin/skeletons";
import { requireManager } from "@/lib/auth/require-manager";
import { dashboardCounts } from "@/lib/dashboard/queries";
import { greeting } from "@/lib/admin/greeting";

function displayName(email: string) {
  const local = email.split("@")[0].split(/[._+-]/)[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "there";
}

async function Stats() {
  const c = await dashboardCounts();
  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 2xl:grid-cols-4">
      <StatCard label="Active VAs" value={c.activeVAs} icon={Users} tint="green" href="/admin/employees?status=active" />
      <StatCard label="VAs on leave" value={c.onLeaveVAs} icon={Plane} tint="yellow" href="/admin/employees?status=on_leave" />
      <StatCard label="Active clients" value={c.activeClients} icon={Building2} tint="violet" href="/admin/clients?status=active" />
      <StatCard label="Prospects" value={c.prospects} icon={Sparkles} tint="blue" href="/admin/clients?status=prospect" />
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, hint }: { href: string; icon: typeof Users; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-badge-brand-bg text-badge-brand">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function QuickActions({ isSuperadmin }: { isSuperadmin: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <QuickAction href="/admin/employees/new" icon={UserRoundPlus} label="Add employee" hint="Start a new 201 file" />
        <QuickAction href="/admin/clients/new" icon={Building} label="Add client" hint="Company, contacts, billing" />
        {isSuperadmin && <QuickAction href="/admin/users" icon={UserPlus} label="Invite manager" hint="Give someone admin access" />}
      </CardContent>
    </Card>
  );
}

async function Dashboard() {
  const me = await requireManager();
  if (!me) redirect("/auth/login");
  const actions = <QuickActions isSuperadmin={me.isSuperadmin} />;

  return (
    <WithAside aside={actions}>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()}, ${displayName(me.email)}`}
        description="Here's how the circl. community looks today."
      />
      <Suspense fallback={<CardsSkeleton />}>
        <Stats />
      </Suspense>
      {/* Below xl the right panel is hidden, so show quick actions in the flow. */}
      <div className="mt-6 xl:hidden">{actions}</div>
    </WithAside>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<CardsSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
