import { it, expect } from "vitest";
import { serviceDbError } from "./errors";

it.each([
  [{ code: "23505", message: 'violates unique constraint "services_sibling_name_key"' }, "name", "A service with this name already exists here."],
  [{ code: "23505", message: 'violates unique constraint "packages_name_key"' }, "name", "A package with this name already exists."],
  [{ code: "23505", message: 'violates unique constraint "package_lines_service_tier_key"' }, "lines", "The same service and tier is listed twice. Combine the hours instead."],
  [{ code: "P0001", message: "parent_has_rates: remove this service's rates before adding subservices" }, "parent_id", "Remove this service's rates (and take it out of packages) before adding subservices."],
  [{ code: "P0001", message: "parent_in_packages: take this service out of packages before adding subservices" }, "parent_id", "Remove this service's rates (and take it out of packages) before adding subservices."],
  [{ code: "P0001", message: "one_level_only: subservices can't have subservices" }, "parent_id", "Subservices can't have their own subservices."],
  [{ code: "P0001", message: "service_has_children: x" }, "parent_id", "A service with subservices can't be moved under another service."],
  [{ code: "P0001", message: "not_priceable: x" }, "lines", "One of the services now has subservices. Pick a subservice instead."],
  [{ code: "23503", message: 'violates foreign key constraint "package_lines_service_id_fkey"' }, "_form", "This service is used in a package. Archive it instead."],
  [{ code: "23503", message: 'violates foreign key constraint "services_parent_id_fkey"' }, "_form", "Delete or move this service's subservices first."],
  [{ code: "P0001", message: "parent_not_found" }, "parent_id", "That parent service no longer exists. Refresh and try again."],
  [{ code: "P0001", message: "service not found" }, "_form", "This service no longer exists. Refresh the page."],
  [{ code: "23503", message: 'insert or update on table "package_lines" violates foreign key constraint "package_lines_service_id_fkey"' }, "lines", "One of the services was deleted. Refresh the page and pick it again."],
  [{ code: "23514", message: 'new row for relation "package_lines" violates check constraint "package_lines_hours_per_month_check"' }, "_form", "Some values are out of range. Check hours and amounts."],
] as const)("%o → %s", (err, field, message) => expect(serviceDbError(err)).toEqual({ field, message }));

it("returns null for unknown errors", () => {
  expect(serviceDbError({ code: "XX000", message: "boom" })).toBeNull();
  expect(serviceDbError(null)).toBeNull();
});
