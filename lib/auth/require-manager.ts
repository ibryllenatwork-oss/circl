import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Manager = { id: string; email: string };

/**
 * The signed-in manager, verified with Supabase Auth, or null.
 * Every signed-in user is management (no public sign-up).
 */
export async function requireManager(): Promise<Manager | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}
