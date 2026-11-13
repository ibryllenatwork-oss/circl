import type { FieldErrors } from "./form";

/** Result of a form server action; `values` lets the form re-fill after an error. */
export type FormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export const SESSION_EXPIRED_MESSAGE = "Your session expired. Sign in again.";
export const GENERIC_SAVE_ERROR = "Could not save. Try again.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/**
 * Strips characters that would break a PostgREST `or=(...ilike...)` filter
 * (separators, grouping, quotes, wildcards). Dots are safe in values and kept,
 * so email searches work.
 */
export function searchTerm(q: string | null | undefined): string {
  return (q ?? "").replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

/** `?page=` → integer from 1 to 10,000 (bad values fall back to 1). */
export function pageNumber(raw: string | null | undefined): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10_000) : 1;
}
