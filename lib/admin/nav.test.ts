import { it, expect } from "vitest";
import { ADMIN_NAV, visibleNav } from "./nav";

it("has Users enabled and module placeholders disabled, in order", () => {
  expect(ADMIN_NAV.map((i) => [i.label, i.href, i.enabled])).toEqual([
    ["Dashboard", "/admin", true],
    ["Users", "/admin/users", true],
    ["HR", "/admin/hr", false],
    ["Services & Rates", "/admin/services", false],
    ["Employees", "/admin/employees", false],
    ["Projects", "/admin/projects", false],
  ]);
});

it("shows Users only to superadmins", () => {
  expect(visibleNav(true).map((i) => i.label)).toContain("Users");
  expect(visibleNav(false).map((i) => i.label)).not.toContain("Users");
  expect(visibleNav(false)).toHaveLength(ADMIN_NAV.length - 1);
});
