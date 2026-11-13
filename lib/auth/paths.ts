const ADMIN_HOME = "/admin";

/** True for /admin and anything under it. */
export function isProtectedPath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

const PROBE_ORIGIN = "http://internal.invalid";

/**
 * Returns `next` only if it is an internal path, otherwise the admin home.
 * Prevents open redirects via ?next=. Rejects "//x", backslashes, and any
 * whitespace/control characters (browsers strip tabs/newlines, so "/\t/x"
 * would become "//x"), then confirms the path resolves to our own origin.
 */
export function safeNext(next: string | null | undefined): string {
  if (typeof next !== "string" || !/^\/(?!\/)/.test(next)) return ADMIN_HOME;
   
  if (/[\x00-\x20\x7f\\]/.test(next)) return ADMIN_HOME;
  try {
    if (new URL(next, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return ADMIN_HOME;
  } catch {
    return ADMIN_HOME;
  }
  return next;
}
