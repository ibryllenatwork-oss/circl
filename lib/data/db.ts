import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireManager, type Manager } from "@/lib/auth/require-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in as a manager.");
    this.name = "UnauthorizedError";
  }
}

/**
 * The single gate for employee/client data. Verifies a manager (respecting
 * local dev mode), then hands over the service-role client. Tables have RLS
 * on with no policies, so this is the only way in.
 */
export async function withManager<T>(
  fn: (db: SupabaseClient, me: Manager) => Promise<T>,
): Promise<T> {
  const me = await requireManager();
  if (!me) throw new UnauthorizedError();
  return fn(createAdminClient(), me);
}
