const ADMIN_HOME = "/admin";

/** True for /admin and anything under it. */
export function isProtectedPath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

/**
 * Returns `next` only if it is an internal path ("/x", not "//x" or "/\x"),
 * otherwise the admin home. Prevents open redirects via ?next=.
 */
export function safeNext(next: string | null | undefined): string {
  if (typeof next !== "string" || !/^\/(?![/\\])/.test(next)) return ADMIN_HOME;
  return next;
}
