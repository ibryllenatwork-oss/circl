"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isNavActive, visibleNav, type NavIcon } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: ShieldCheck,
  employees: Users,
  clients: Building2,
  services: Tags,
  projects: FolderKanban,
};

export function NavLinks({
  isSuperadmin,
  collapsed = false,
  onNavigate,
}: {
  isSuperadmin: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {visibleNav(isSuperadmin).map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.enabled && isNavActive(pathname, item.href);
        const body = (
          <>
            {active && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand-orange" />}
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
            {!item.enabled && !collapsed && (
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Soon
              </span>
            )}
          </>
        );
        const classes = cn(
          "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          item.enabled
            ? active
              ? "bg-white/[0.14] text-sidebar-foreground"
              : "text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground"
            : "cursor-not-allowed text-sidebar-foreground/40",
        );

        const node = item.enabled ? (
          <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={classes}>
            {body}
          </Link>
        ) : (
          <span aria-disabled="true" className={classes}>
            {body}
          </span>
        );

        return (
          <li key={item.href}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{node}</TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {!item.enabled && " · soon"}
                </TooltipContent>
              </Tooltip>
            ) : (
              node
            )}
          </li>
        );
      })}
    </ul>
  );
}
