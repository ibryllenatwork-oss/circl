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

/** Strips characters that would break a PostgREST `or=(...ilike...)` filter. */
export function searchTerm(q: string | null | undefined): string {
  return (q ?? "").replace(/[,()%*\\:."']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}
