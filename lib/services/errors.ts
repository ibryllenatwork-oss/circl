const SPLIT = "Remove this service's rates (and take it out of packages) before adding subservices.";

const RULES: { match: (code: string, msg: string) => boolean; field: string; message: string }[] = [
  { match: (c, m) => c === "23505" && m.includes("services_sibling_name_key"), field: "name", message: "A service with this name already exists here." },
  { match: (c, m) => c === "23505" && m.includes("packages_name_key"), field: "name", message: "A package with this name already exists." },
  {
    match: (c, m) => c === "23505" && m.includes("package_lines_service_tier_key"),
    field: "lines",
    message: "The same service and tier is listed twice. Combine the hours instead.",
  },
  { match: (_c, m) => m.startsWith("parent_has_rates") || m.startsWith("parent_in_packages"), field: "parent_id", message: SPLIT },
  { match: (_c, m) => m.startsWith("one_level_only"), field: "parent_id", message: "Subservices can't have their own subservices." },
  {
    match: (_c, m) => m.startsWith("service_has_children"),
    field: "parent_id",
    message: "A service with subservices can't be moved under another service.",
  },
  { match: (_c, m) => m.startsWith("not_priceable"), field: "lines", message: "One of the services now has subservices. Pick a subservice instead." },
  {
    match: (c, m) => c === "23503" && m.includes('on table "package_lines"') && m.includes("package_lines_service_id_fkey"),
    field: "lines",
    message: "One of the services was deleted. Refresh the page and pick it again.",
  },
  {
    match: (c, m) => c === "23503" && m.includes("package_lines_service_id_fkey"),
    field: "_form",
    message: "This service is used in a package. Archive it instead.",
  },
  { match: (_c, m) => m.startsWith("parent_not_found"), field: "parent_id", message: "That parent service no longer exists. Refresh and try again." },
  { match: (_c, m) => m.startsWith("service not found"), field: "_form", message: "This service no longer exists. Refresh the page." },
  { match: (c) => c === "23514", field: "_form", message: "Some values are out of range. Check hours and amounts." },
  {
    match: (c, m) => c === "23503" && m.includes("services_parent_id_fkey"),
    field: "_form",
    message: "Delete or move this service's subservices first.",
  },
];

/** Maps a Postgres/trigger error from the services tables to a field and a friendly message. */
export function serviceDbError(err: { code?: string; message?: string } | null | undefined): { field: string; message: string } | null {
  if (!err) return null;
  const code = err.code ?? "";
  const msg = err.message ?? "";
  const rule = RULES.find((r) => r.match(code, msg));
  return rule ? { field: rule.field, message: rule.message } : null;
}
