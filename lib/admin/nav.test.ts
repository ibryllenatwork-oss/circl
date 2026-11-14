import { it, expect } from "vitest";
import { ADMIN_NAV, isNavActive, visibleNav } from "./nav";

it.each([
  ["/admin", "/admin", true],
  ["/admin/employees", "/admin", false],
  ["/admin/employees/abc/edit", "/admin/employees", true],
  ["/admin/employeesx", "/admin/employees", false],
  ["/admin/clients", "/admin/employees", false],
])("%s active for %s: %s", (path, href, expected) => expect(isNavActive(path, href)).toBe(expected));

it("lists modules in order with Employees and Clients live", () => {
  expect(ADMIN_NAV.map((i) => [i.label, i.href, i.enabled])).toEqual([
    ["Dashboard", "/admin", true],
    ["Users", "/admin/users", true],
    ["Employees", "/admin/employees", true],
    ["Clients", "/admin/clients", true],
    ["Services & Rates", "/admin/services", false],
    ["Projects", "/admin/projects", false],
  ]);
});

it("shows Users only to superadmins", () => {
  expect(visibleNav(true).map((i) => i.label)).toContain("Users");
  expect(visibleNav(false).map((i) => i.label)).not.toContain("Users");
  expect(visibleNav(false)).toHaveLength(ADMIN_NAV.length - 1);
});
