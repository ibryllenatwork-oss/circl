/**
 * Local-development switch that skips sign-in and treats every visitor as a
 * superadmin. It can never turn on in a production build (`next build` /
 * Vercel), whatever AUTH_BYPASS is set to.
 */
export function authBypassEnabled(env: {
  NODE_ENV?: string;
  AUTH_BYPASS?: string;
} = process.env): boolean {
  return env.NODE_ENV !== "production" && env.AUTH_BYPASS === "true";
}

/** Who you are while the bypass is on. */
export const DEV_MANAGER = {
  id: "dev-bypass",
  email: "dev-mode@localhost",
  isSuperadmin: true,
} as const;
