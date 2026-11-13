export type AdminNavItem = { label: string; href: string; enabled: boolean };

/** Sidebar entries. Flip `enabled` as each module ships. */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", enabled: true },
  { label: "Users", href: "/admin/users", enabled: true },
  { label: "HR", href: "/admin/hr", enabled: false },
  { label: "Services & Rates", href: "/admin/services", enabled: false },
  { label: "Employees", href: "/admin/employees", enabled: false },
  { label: "Projects", href: "/admin/projects", enabled: false },
];
