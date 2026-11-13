import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth/require-manager";

/**
 * Verifies the session with Supabase Auth (getUser, not just the JWT) before
 * rendering any admin page, so a removed manager is locked out on their next
 * request rather than when their access token expires.
 */
export async function AdminGate({ children }: { children: React.ReactNode }) {
  if (!(await requireManager())) redirect("/auth/login");
  return children;
}
