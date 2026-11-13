"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleNav } from "@/lib/admin/nav";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function Sidebar({ isSuperadmin }: { isSuperadmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-4 border-b p-4 md:min-h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <Link href="/admin" className="text-lg font-semibold">
        circl. admin
      </Link>
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {visibleNav(isSuperadmin).map((item) =>
          item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent",
                isActive(pathname, item.href) && "bg-accent font-medium",
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground"
            >
              {item.label}
              <span className="rounded border px-1.5 text-[10px] uppercase">
                Soon
              </span>
            </span>
          ),
        )}
      </nav>
      <div className="md:mt-auto">
        <LogoutButton />
      </div>
    </aside>
  );
}
