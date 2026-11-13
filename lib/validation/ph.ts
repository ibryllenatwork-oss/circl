import { z } from "zod";

/** Digits only, or null if anything other than digits, spaces and dashes is present. */
function digitsOf(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[\d\s-]+$/.test(trimmed)) return null;
  return trimmed.replace(/\D/g, "");
}

function group(digits: string, sizes: number[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of sizes) {
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  return parts.join("-");
}

function formatter(lengths: Record<number, number[]>) {
  return (value: string): string | null => {
    const d = digitsOf(value);
    if (!d || !(d.length in lengths)) return null;
    return group(d, lengths[d.length]);
  };
}

/** SSS: 10 digits → ##-#######-# */
export const formatSSS = formatter({ 10: [2, 7, 1] });
/** PhilHealth: 12 digits → ##-#########-# */
export const formatPhilHealth = formatter({ 12: [2, 9, 1] });
/** Pag-IBIG (HDMF): 12 digits → ####-####-#### */
export const formatPagIbig = formatter({ 12: [4, 4, 4] });
/** TIN: 9 or 12 digits → ###-###-### or ###-###-###-### */
export const formatTIN = formatter({ 9: [3, 3, 3], 12: [3, 3, 3, 3] });

/** Philippine mobile → +639XXXXXXXXX (accepts 09…, 639…, +639…, with spaces/dashes). */
export function formatPHMobile(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\+?[\d\s-]+$/.test(trimmed)) return null;
  const d = trimmed.replace(/\D/g, "");
  const local = d.startsWith("63") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : null;
  if (!local || local.length !== 10 || !local.startsWith("9")) return null;
  return `+63${local}`;
}

/** Optional form field: blank → null, otherwise formatted or a validation error. */
function optionalFormatted(format: (v: string) => string | null, message: string) {
  return z
    .string()
    .nullish()
    .transform((v, ctx) => {
      if (v == null || v.trim() === "") return null;
      const formatted = format(v);
      if (!formatted) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return formatted;
    });
}

export const optionalSSS = optionalFormatted(formatSSS, "SSS number must have 10 digits.");
export const optionalPhilHealth = optionalFormatted(
  formatPhilHealth,
  "PhilHealth number must have 12 digits.",
);
export const optionalPagIbig = optionalFormatted(formatPagIbig, "Pag-IBIG number must have 12 digits.");
export const optionalTIN = optionalFormatted(formatTIN, "TIN must have 9 or 12 digits.");
export const optionalPHMobile = optionalFormatted(
  formatPHMobile,
  "Enter a PH mobile number like 0917 123 4567.",
);

/** Maps a Postgres unique-violation (23505) on a known index/constraint to a form field. */
export function uniqueViolationField(
  err: { code?: string; message?: string } | null | undefined,
  indexToField: Record<string, string>,
): string | null {
  if (!err || err.code !== "23505") return null;
  for (const [index, field] of Object.entries(indexToField)) {
    if (err.message?.includes(index)) return field;
  }
  return null;
}
