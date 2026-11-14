import "server-only";
import { withManager } from "@/lib/data/db";

export type DashboardCounts = {
  activeVAs: number;
  onLeaveVAs: number;
  activeClients: number;
  prospects: number;
};

/** Four head-count queries (no rows transferred). */
export async function dashboardCounts(): Promise<DashboardCounts> {
  return withManager(async (db) => {
    const count = async (table: "employees" | "clients", status: string) => {
      const { count: n, error } = await db.from(table).select("id", { count: "exact", head: true }).eq("status", status);
      if (error) throw error;
      return n ?? 0;
    };
    const [activeVAs, onLeaveVAs, activeClients, prospects] = await Promise.all([
      count("employees", "active"),
      count("employees", "on_leave"),
      count("clients", "active"),
      count("clients", "prospect"),
    ]);
    return { activeVAs, onLeaveVAs, activeClients, prospects };
  });
}
