import "server-only";
import { withManager } from "@/lib/data/db";
import { isUuid, searchTerm } from "@/lib/validation/action";
import { effectiveActive, packageTotals, type Line, type PackageTotals, type RateTable, type Tier } from "./pricing";
import type { PackageStatus } from "./schema";

type ServiceRow = {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  position: number;
  active: boolean;
};
type RateRow = { service_id: string; tier: Tier; client_rate: number | string; va_rate: number | string };

export type CatalogItem = ServiceRow & {
  rates: RateTable[string];
  usedInPackages: number;
  childCount: number;
  parentActive: boolean | null;
  effectiveActive: boolean;
};
export type CatalogService = CatalogItem & { children: CatalogItem[] };

function rateTable(rows: RateRow[]): RateTable {
  const table: RateTable = {};
  for (const r of rows) {
    (table[r.service_id] ??= {})[r.tier] = { client_rate: Number(r.client_rate), va_rate: Number(r.va_rate) };
  }
  return table;
}

const byPosition = (a: ServiceRow, b: ServiceRow) => a.position - b.position || a.name.localeCompare(b.name);

/** Everything the catalog and pickers need, in three small queries. */
async function loadCatalogData() {
  return withManager(async (db) => {
    const [services, rates, lines] = await Promise.all([
      db.from("services").select("id, parent_id, name, description, position, active"),
      db.from("service_rates").select("service_id, tier, client_rate, va_rate"),
      db.from("package_lines").select("service_id"),
    ]);
    for (const r of [services, rates, lines]) if (r.error) throw r.error;
    const usage = new Map<string, number>();
    for (const l of (lines.data ?? []) as { service_id: string }[]) usage.set(l.service_id, (usage.get(l.service_id) ?? 0) + 1);
    return { services: (services.data ?? []) as ServiceRow[], rates: rateTable((rates.data ?? []) as RateRow[]), usage };
  });
}

function buildTree(services: ServiceRow[], rates: RateTable, usage: Map<string, number>): CatalogService[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  const item = (s: ServiceRow): CatalogItem => {
    const parent = s.parent_id ? byId.get(s.parent_id) : null;
    const parentActive = parent ? parent.active : null;
    return {
      ...s,
      rates: rates[s.id] ?? {},
      usedInPackages: usage.get(s.id) ?? 0,
      childCount: services.filter((c) => c.parent_id === s.id).length,
      parentActive,
      effectiveActive: effectiveActive(s.active, parentActive),
    };
  };
  return services
    .filter((s) => !s.parent_id)
    .sort(byPosition)
    .map((top) => ({
      ...item(top),
      children: services.filter((c) => c.parent_id === top.id).sort(byPosition).map(item),
    }));
}

export async function getCatalog({ includeArchived = false } = {}): Promise<CatalogService[]> {
  const { services, rates, usage } = await loadCatalogData();
  const tree = buildTree(services, rates, usage);
  if (includeArchived) return tree;
  return tree.filter((s) => s.active).map((s) => ({ ...s, children: s.children.filter((c) => c.active) }));
}

export type PickerOption = { id: string; label: string; group: string; active: boolean };

/** Priceable services (no subservices) for the package line picker, plus current rates. */
export async function pricingData(): Promise<{ options: PickerOption[]; rates: RateTable }> {
  const { services, rates, usage } = await loadCatalogData();
  const tree = buildTree(services, rates, usage);
  const options: PickerOption[] = [];
  for (const top of tree) {
    if (top.children.length === 0) options.push({ id: top.id, label: top.name, group: "Services", active: top.effectiveActive });
    for (const c of top.children) options.push({ id: c.id, label: c.name, group: top.name, active: c.effectiveActive });
  }
  return { options, rates };
}

export type PackageListItem = {
  id: string;
  name: string;
  description: string | null;
  status: PackageStatus;
  monthly_amount: number;
  lineCount: number;
  totals: PackageTotals;
  needsReview: boolean;
};

export type PackageStatusFilter = PackageStatus | "all";
export type PackageSort = { key: "name" | "amount"; dir: "asc" | "desc" };

export async function listPackages(opts: { q?: string; status?: PackageStatusFilter; sort?: PackageSort } = {}): Promise<PackageListItem[]> {
  const [{ services, rates }, packages] = await Promise.all([
    loadCatalogData(),
    withManager(async (db) => {
      let query = db.from("packages").select("id, name, description, status, monthly_amount, package_lines(service_id, tier, hours_per_month)");
      const status = opts.status ?? "all";
      if (status !== "all") query = query.eq("status", status);
      const q = searchTerm(opts.q);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),
  ]);
  const active = new Map<string, boolean>();
  const byId = new Map(services.map((s) => [s.id, s]));
  for (const s of services) active.set(s.id, effectiveActive(s.active, s.parent_id ? (byId.get(s.parent_id)?.active ?? null) : null));

  const rows = (packages as unknown as (Omit<PackageListItem, "lineCount" | "totals" | "needsReview"> & {
    package_lines: { service_id: string; tier: Tier; hours_per_month: number | string }[];
  })[]).map(({ package_lines, ...p }) => {
    const lines: Line[] = package_lines.map((l) => ({ ...l, hours_per_month: Number(l.hours_per_month) }));
    return {
      ...p,
      monthly_amount: Number(p.monthly_amount),
      lineCount: lines.length,
      totals: packageTotals(lines, rates, Number(p.monthly_amount)),
      needsReview: lines.some((l) => active.get(l.service_id) === false),
    };
  });

  const sort = opts.sort ?? { key: "name", dir: "asc" };
  const sign = sort.dir === "asc" ? 1 : -1;
  return rows.sort((a, b) =>
    sort.key === "amount"
      ? sign * (a.monthly_amount - b.monthly_amount) || a.name.localeCompare(b.name)
      : sign * a.name.localeCompare(b.name),
  );
}

export type PackageDetail = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  status: PackageStatus;
  monthly_amount: number;
  updated_at: string;
  updated_by: string | null;
  lines: Line[];
};

export async function getPackage(id: string): Promise<PackageDetail | null> {
  if (!isUuid(id)) return null;
  return withManager(async (db) => {
    const { data, error } = await db
      .from("packages")
      .select("id, name, description, notes, status, monthly_amount, updated_at, updated_by, package_lines(service_id, tier, hours_per_month, position)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { package_lines, ...p } = data as unknown as Omit<PackageDetail, "lines"> & {
      package_lines: { service_id: string; tier: Tier; hours_per_month: number | string; position: number }[];
    };
    return {
      ...p,
      monthly_amount: Number(p.monthly_amount),
      lines: [...package_lines]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ service_id: l.service_id, tier: l.tier, hours_per_month: Number(l.hours_per_month) })),
    };
  });
}

/** Top-level services that may receive subservices (no rates, not used in packages). */
export async function parentOptions(): Promise<{ id: string; name: string; blocked: string | null }[]> {
  const { services, rates, usage } = await loadCatalogData();
  return services
    .filter((s) => !s.parent_id)
    .sort(byPosition)
    .map((s) => ({
      id: s.id,
      name: s.name,
      blocked: rates[s.id] && Object.keys(rates[s.id]).length ? "has rates" : usage.get(s.id) ? "used in packages" : null,
    }));
}
