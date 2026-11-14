import { Search } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { manilaToday } from "@/lib/admin/greeting";

export function AdminHeader({
  email,
  role,
  devMode,
  isSuperadmin,
}: {
  email: string;
  role: string;
  devMode: boolean;
  isSuperadmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <MobileNav isSuperadmin={isSuperadmin} />
      <form action="/admin/search" method="get" role="search" className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="global-search" className="sr-only">
          Search employees and clients
        </label>
        <input
          id="global-search"
          name="q"
          type="search"
          placeholder="Search employees & clients…"
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0"
        />
      </form>
      <div className="ml-auto flex items-center gap-4">
        <time className="hidden whitespace-nowrap text-sm text-muted-foreground md:block">{manilaToday()}</time>
        <UserMenu email={email} role={role} devMode={devMode} />
      </div>
    </header>
  );
}
