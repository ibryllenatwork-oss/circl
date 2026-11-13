import { it, expect } from "vitest";
import { ADMIN_NAV } from "./nav";

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
