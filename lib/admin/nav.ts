export type AdminNavItem = {
  label: string;
  href: string;
  enabled: boolean;
  superadminOnly?: boolean;
};

/** Sidebar entries. Flip `enabled` as each module ships. */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", enabled: true },
  { label: "Users", href: "/admin/users", enabled: true, superadminOnly: true },
  { label: "HR", href: "/admin/hr", enabled: false },
  { label: "Services & Rates", href: "/admin/services", enabled: false },
  { label: "Employees", href: "/admin/employees", enabled: false },
  { label: "Projects", href: "/admin/projects", enabled: false },
];

export function visibleNav(isSuperadmin: boolean): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => isSuperadmin || !item.superadminOnly);
}
