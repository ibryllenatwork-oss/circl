export type NavIcon = "dashboard" | "users" | "employees" | "clients" | "services" | "projects";

export type AdminNavItem = {
  label: string;
  href: string;
  enabled: boolean;
  icon: NavIcon;
  superadminOnly?: boolean;
};

/** Sidebar entries. Flip `enabled` as each module ships. */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", enabled: true, icon: "dashboard" },
  { label: "Users", href: "/admin/users", enabled: true, icon: "users", superadminOnly: true },
  { label: "Employees", href: "/admin/employees", enabled: true, icon: "employees" },
  { label: "Clients", href: "/admin/clients", enabled: true, icon: "clients" },
  { label: "Services & Rates", href: "/admin/services", enabled: true, icon: "services" },
  { label: "Projects", href: "/admin/projects", enabled: false, icon: "projects" },
];

/** Active when on the item's page or below it (Dashboard only matches exactly). */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function visibleNav(isSuperadmin: boolean): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => isSuperadmin || !item.superadminOnly);
}

/** Cookie that remembers a collapsed sidebar (read on the server, written by the sidebar). */
export const SIDEBAR_COOKIE = "sidebar_state";
