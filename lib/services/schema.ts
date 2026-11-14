import { z } from "zod";
import { formValues, optionalText, requiredText, toFieldErrors, type FieldErrors } from "@/lib/validation/form";
import { isUuid } from "@/lib/validation/action";
import { TIERS, type Tier } from "./pricing";

type Parsed<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors };

// --------------------------------------------------------------- service
const serviceSchema = z.object({
  name: z.preprocess((v) => (v == null ? "" : v), z.string().trim().min(1, "Name is required.").max(120, "Keep the name under 120 characters.")),
  description: optionalText,
  parent_id: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().refine(isUuid, "Choose a valid parent service.").nullable(),
  ),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export function parseServiceForm(fd: FormData): Parsed<ServiceInput> {
  const r = serviceSchema.safeParse(formValues(fd));
  return r.success ? { ok: true, data: r.data } : { ok: false, fieldErrors: toFieldErrors(r.error) };
}

// ----------------------------------------------------------------- rates
export type RateInput = { tier: Tier; client_rate: number | null; va_rate: number | null };

function money(raw: string | undefined): { value: number | null; error?: string } {
  if (raw == null || raw.trim() === "") return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { value: null, error: "Enter a number." };
  if (n < 0) return { value: null, error: "Can't be negative." };
  if (n > 10_000) return { value: null, error: "That rate is too high." };
  return { value: Math.round(n * 100) / 100 };
}

/** Fields: `${tier}_client` and `${tier}_va` for each tier. A fully blank tier means "no rate". */
export function parseRatesForm(fd: FormData): Parsed<RateInput[]> {
  const v = formValues(fd);
  const errors: FieldErrors = {};
  const data: RateInput[] = [];
  for (const tier of TIERS) {
    const c = money(v[`${tier}_client`]);
    const a = money(v[`${tier}_va`]);
    if (c.error) errors[`${tier}_client`] = c.error;
    if (a.error) errors[`${tier}_va`] = a.error;
    if (!c.error && !a.error && (c.value == null) !== (a.value == null)) {
      errors[c.value == null ? `${tier}_client` : `${tier}_va`] = "Enter both the client and VA rate, or leave both blank.";
    }
    data.push({ tier, client_rate: c.value, va_rate: a.value });
  }
  return Object.keys(errors).length ? { ok: false, fieldErrors: errors } : { ok: true, data };
}

// --------------------------------------------------------------- package
const lineSchema = z.object({
  service_id: z.string().refine(isUuid, "Choose a service."),
  tier: z.enum(TIERS, { message: "Choose a tier." }),
  hours_per_month: z.coerce
    .number({ message: "Enter the hours." })
    .gt(0, "Hours must be more than 0.")
    .max(744, "That's more hours than a month has."),
});

const linesSchema = z
  .array(lineSchema)
  .min(1, "Add at least one line.")
  .max(50, "A package can have up to 50 lines.")
  .superRefine((lines, ctx) => {
    const seen = new Set<string>();
    lines.forEach((l, i) => {
      const key = `${l.service_id}:${l.tier}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: [i], message: "The same service and tier is listed twice. Combine the hours instead." });
      }
      seen.add(key);
    });
  });

const packageSchema = z.object({
  name: requiredText("Name is required."),
  description: optionalText,
  notes: optionalText,
  monthly_amount: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce
      .number({ message: "Enter the package amount." })
      .min(0, "Can't be negative.")
      .max(1_000_000, "That amount is too large."),
  ),
  active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export type PackageInput = z.infer<typeof packageSchema>;
export type LineInput = z.infer<typeof lineSchema>;

export function parsePackageForm(fd: FormData): Parsed<{ package: PackageInput; lines: LineInput[] }> {
  const values = formValues(fd);
  const errors: FieldErrors = {};

  const pkg = packageSchema.safeParse(values);
  if (!pkg.success) Object.assign(errors, toFieldErrors(pkg.error));

  let raw: unknown;
  try {
    raw = JSON.parse(values.lines ?? "[]");
  } catch {
    raw = null;
  }
  const lines = linesSchema.safeParse(raw);
  if (!lines.success) {
    const issue = lines.error.issues[0];
    errors.lines =
      raw === null
        ? "The lines couldn't be read. Try again."
        : issue.path.length > 0 && typeof issue.path[0] === "number"
          ? `Line ${issue.path[0] + 1}: ${issue.message}`
          : issue.message;
  }

  if (!pkg.success || !lines.success) return { ok: false, fieldErrors: errors };
  return { ok: true, data: { package: pkg.data, lines: lines.data } };
}
