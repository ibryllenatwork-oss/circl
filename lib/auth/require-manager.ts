import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSuperadmin, parseSuperadminEmails } from "@/lib/auth/roles";

export type Manager = { id: string; email: string; isSuperadmin: boolean };

/** Superadmin emails from the server-only SUPERADMIN_EMAILS setting. */
export function superadminEmails(): string[] {
  return parseSuperadminEmails(process.env.SUPERADMIN_EMAILS);
}

/**
 * The signed-in manager, verified with Supabase Auth, or null.
 * Every signed-in user is management (no public sign-up).
 */
export async function requireManager(): Promise<Manager | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const email = data.user.email ?? "";
  return { id: data.user.id, email, isSuperadmin: isSuperadmin(email, superadminEmails()) };
}
