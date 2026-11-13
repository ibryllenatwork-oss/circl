import { z } from "zod";

export type FieldErrors = Record<string, string>;

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Optional free text: trimmed, blank → null. */
export const optionalText = z.preprocess(
  blankToNull,
  z.string().trim().max(2000).nullish().transform((v) => v ?? null),
);

/** Required text: trimmed, non-empty. */
export const requiredText = (message: string) =>
  z.preprocess((v) => (v == null ? "" : v), z.string().trim().min(1, message).max(500));

export const optionalEmail = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .nullish()
    .transform((v) => v ?? null),
);

export const requiredEmail = z.preprocess(
  (v) => (v == null ? "" : v),
  z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address."),
);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const optionalDate = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(ISO_DATE, "Enter a valid date.")
    .nullish()
    .transform((v) => v ?? null),
);

export const requiredDate = (message: string) =>
  z.preprocess((v) => (v == null ? "" : v), z.string().min(1, message).regex(ISO_DATE, "Enter a valid date."));

export const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(blankToNull, z.enum(values).nullish().transform((v) => v ?? null));

export const requiredEnum = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.enum(values, { message }));

/** Optional non-negative number from a text input. */
export const optionalAmount = (max: number) =>
  z.preprocess(
    blankToNull,
    z.coerce
      .number({ message: "Enter a number." })
      .min(0, "Can't be negative.")
      .max(max, "That number is too large.")
      .nullish()
      .transform((v) => v ?? null),
  );

/** Comma-separated tags → trimmed, de-duplicated array. */
export const tags = z.preprocess(
  (v) =>
    typeof v === "string"
      ? [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))]
      : (v ?? []),
  z.array(z.string().max(100)).max(50),
);

/** Flattens zod issues into { field: firstMessage }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** FormData → plain object of strings (first value per key). */
export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (!(k in out) && typeof v === "string") out[k] = v;
  return out;
}
