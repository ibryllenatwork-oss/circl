"use client";

import { useState } from "react";
import { ChevronsLeft, ChevronsRight, FlaskConical } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandMark } from "./brand-mark";
import { NavLinks } from "./nav-links";
import { cn } from "@/lib/utils";

export const SIDEBAR_COOKIE = "sidebar_state";

/** Fixed desktop sidebar (≥ lg). Collapse state is kept in a cookie so the server renders the right width. */
export function AppSidebar({
  isSuperadmin,
  devMode,
  initialCollapsed,
}: {
  isSuperadmin: boolean;
  devMode: boolean;
  initialCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label="Main navigation"
        className={cn(
          "bg-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 px-3 py-5 text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
      >
        <div className={cn("px-1.5", collapsed && "px-0")}>
          <BrandMark collapsed={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NavLinks isSuperadmin={isSuperadmin} collapsed={collapsed} />
        </nav>
        {devMode && !collapsed && (
          <p className="flex items-start gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-sidebar-foreground/80">
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Dev mode: sign-in is off on this computer.
          </p>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/[0.08] hover:text-sidebar-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          <span className={cn(collapsed && "sr-only")}>Collapse</span>
        </button>
      </aside>
    </TooltipProvider>
  );
}
