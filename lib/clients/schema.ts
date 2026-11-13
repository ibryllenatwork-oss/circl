import { z } from "zod";
import {
  formValues,
  optionalAmount,
  optionalDate,
  optionalEmail,
  optionalEnum,
  optionalText,
  requiredEnum,
  requiredText,
  tags,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/form";
import { BILLING_CYCLES, CLIENT_STATUSES, CURRENCIES } from "./labels";
import { RATE_BASES } from "@/lib/employees/labels";

const website = z.preprocess(
  (v) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const t = v.trim();
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  },
  z.string().url("Enter a valid website.").max(300).nullable(),
);

export const clientFormSchema = z
  .object({
    company_name: requiredText("Company name is required."),
    industry: optionalText,
    website,
    country: optionalText,
    timezone: optionalText,
    status: requiredEnum(CLIENT_STATUSES, "Choose a status."),
    start_date: optionalDate,
    billing_email: optionalEmail,
    billing_address: optionalText,
    currency: requiredEnum(CURRENCIES, "Choose a currency."),
    rate: optionalAmount(9_999_999),
    rate_basis: optionalEnum(RATE_BASES),
    billing_cycle: optionalEnum(BILLING_CYCLES),
    payment_method: optionalText,
    services: tags,
    hours_per_week: optionalAmount(168),
    contract_start: optionalDate,
    contract_end: optionalDate,
    notes: optionalText,
  })
  .superRefine((c, ctx) => {
    if (c.contract_start && c.contract_end && c.contract_end < c.contract_start) {
      ctx.addIssue({ code: "custom", path: ["contract_end"], message: "Contract end can't be before the start." });
    }
  });

export const contactSchema = z.object({
  name: requiredText("Each contact needs a name."),
  role: optionalText,
  email: optionalEmail,
  phone: optionalText,
  is_primary: z.boolean().optional().default(false),
});

const contactsSchema = z
  .array(contactSchema)
  .min(1, "Add at least one contact.")
  .max(20, "That's too many contacts.")
  .refine((list) => list.filter((c) => c.is_primary).length <= 1, "Only one primary contact is allowed.");

export type ClientInput = z.infer<typeof clientFormSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export function parseClientForm(
  fd: FormData,
): { ok: true; data: { client: ClientInput; contacts: ContactInput[] } } | { ok: false; fieldErrors: FieldErrors } {
  const values = formValues(fd);
  const errors: FieldErrors = {};

  const client = clientFormSchema.safeParse(values);
  if (!client.success) Object.assign(errors, toFieldErrors(client.error));

  let rawContacts: unknown;
  try {
    rawContacts = JSON.parse(values.contacts ?? "[]");
  } catch {
    rawContacts = null;
  }
  const contacts = contactsSchema.safeParse(rawContacts);
  if (!contacts.success) {
    const issue = contacts.error.issues[0];
    errors.contacts =
      issue.path.length > 1
        ? `Contact ${Number(issue.path[0]) + 1}: ${issue.message}`
        : rawContacts === null
          ? "Contacts couldn't be read. Try again."
          : issue.message;
  }

  if (!client.success || !contacts.success) return { ok: false, fieldErrors: errors };
  return { ok: true, data: { client: client.data, contacts: contacts.data } };
}
