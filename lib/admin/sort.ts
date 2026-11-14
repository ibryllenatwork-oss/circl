export type SortDir = "asc" | "desc";
export type OrderColumn = { column: string; ascending: boolean };

export type SortSpec = {
  /** key → columns to order by, in priority order */
  keys: Record<string, string[]>;
  defaultKey: string;
  defaultDir: SortDir;
  /** unique column appended last so paging is stable */
  tiebreaker: string;
};

export const EMPLOYEE_SORT: SortSpec = {
  keys: {
    name: ["last_name", "first_name"],
    no: ["seq"],
    position: ["position"],
    status: ["status"],
    hired: ["date_hired"],
  },
  defaultKey: "hired",
  defaultDir: "desc",
  tiebreaker: "seq",
};

export const CLIENT_SORT: SortSpec = {
  keys: {
    company: ["company_name"],
    status: ["status"],
    contract_end: ["contract_end"],
  },
  defaultKey: "company",
  defaultDir: "asc",
  tiebreaker: "id",
};

/** Turns untrusted ?sort=&dir= into a whitelisted order list. */
export function parseSort(
  raw: { sort?: string; dir?: string },
  spec: SortSpec,
): { key: string; dir: SortDir; order: OrderColumn[] } {
  const known = raw.sort != null && Object.hasOwn(spec.keys, raw.sort);
  const key = known ? (raw.sort as string) : spec.defaultKey;
  const dir: SortDir =
    raw.dir === "asc" || raw.dir === "desc" ? raw.dir : known ? "asc" : spec.defaultDir;
  const ascending = dir === "asc";
  const columns = spec.keys[key];
  const order = columns.map((column) => ({ column, ascending }));
  if (!columns.includes(spec.tiebreaker)) order.push({ column: spec.tiebreaker, ascending });
  return { key, dir, order };
}
