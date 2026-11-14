import { it, expect } from "vitest";
import { withParams } from "./data-table";

it("changes and removes params while keeping repeated ones", () => {
  const params = { status: ["active", "on_leave"], q: "ana", page: "3", view: "x" };
  expect(withParams("/admin/employees", params, { sort: "name", dir: "asc", page: undefined, view: undefined })).toBe(
    "/admin/employees?status=active&status=on_leave&q=ana&sort=name&dir=asc",
  );
  expect(withParams("/admin/clients", {}, {})).toBe("/admin/clients");
  expect(withParams("/a", { view: "1" }, { view: "2" })).toBe("/a?view=2");
});
