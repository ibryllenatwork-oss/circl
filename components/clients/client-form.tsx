"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataList, FormSection, SelectField, TextAreaField, TextField } from "@/components/admin/form-fields";
import {
  BILLING_CYCLES,
  CLIENT_STATUSES,
  CURRENCIES,
  PAYMENT_SUGGESTIONS,
  SERVICE_SUGGESTIONS,
} from "@/lib/clients/labels";
import { RATE_BASES } from "@/lib/employees/labels";
import type { ClientDetail } from "@/lib/clients/queries";
import type { FormState } from "@/lib/validation/action";

type Action = (prev: FormState | null, formData: FormData) => Promise<FormState>;
type Contact = { name: string; role: string; email: string; phone: string; is_primary: boolean };

const blankContact = (): Contact => ({ name: "", role: "", email: "", phone: "", is_primary: false });

function initialValues(c: ClientDetail | null): Record<string, string> {
  if (!c) return { status: "prospect", currency: "USD" };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) {
    if (v == null || typeof v === "object") {
      if (Array.isArray(v) && k === "services") out[k] = v.join(", ");
      continue;
    }
    out[k] = String(v);
  }
  return out;
}

function initialContacts(c: ClientDetail | null, values?: Record<string, string>): Contact[] {
  if (values?.contacts) {
    try {
      const parsed = JSON.parse(values.contacts) as Contact[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* fall through */
    }
  }
  if (c?.contacts.length) {
    return c.contacts.map((x) => ({
      name: x.name,
      role: x.role ?? "",
      email: x.email ?? "",
      phone: x.phone ?? "",
      is_primary: x.is_primary,
    }));
  }
  return [{ ...blankContact(), is_primary: true }];
}

function ContactsEditor({ initial, error }: { initial: Contact[]; error?: string }) {
  const [contacts, setContacts] = useState<Contact[]>(initial);
  const update = (i: number, patch: Partial<Contact>) =>
    setContacts((list) => list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const makePrimary = (i: number) => setContacts((list) => list.map((c, j) => ({ ...c, is_primary: j === i })));

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">
        Contacts <span className="text-red-500">*</span>
      </legend>
      <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />
      {contacts.map((c, i) => (
        <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <input aria-label={`Contact ${i + 1} name`} placeholder="Name *" value={c.name} onChange={(e) => update(i, { name: e.target.value })} className="h-9 rounded-md border bg-transparent px-3 text-sm" />
          <input aria-label={`Contact ${i + 1} role`} placeholder="Role, e.g. CEO" value={c.role} onChange={(e) => update(i, { role: e.target.value })} className="h-9 rounded-md border bg-transparent px-3 text-sm" />
          <input aria-label={`Contact ${i + 1} email`} type="email" placeholder="Email" value={c.email} onChange={(e) => update(i, { email: e.target.value })} className="h-9 rounded-md border bg-transparent px-3 text-sm" />
          <input aria-label={`Contact ${i + 1} phone`} placeholder="Phone / WhatsApp" value={c.phone} onChange={(e) => update(i, { phone: e.target.value })} className="h-9 rounded-md border bg-transparent px-3 text-sm" />
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 whitespace-nowrap">
              <input type="radio" name="primary-contact" checked={c.is_primary} onChange={() => makePrimary(i)} />
              Primary
            </label>
            {contacts.length > 1 && (
              <button type="button" onClick={() => setContacts((l) => l.filter((_, j) => j !== i))} className="text-xs text-red-600 underline">
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setContacts((l) => [...l, blankContact()])}>
          Add contact
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </fieldset>
  );
}

export function ClientForm({
  action,
  client,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  client: ClientDetail | null;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const v = state?.values ?? initialValues(client);
  const err = state?.fieldErrors ?? {};
  const formKey = state ? JSON.stringify([state.values, state.fieldErrors, state.error]) : "initial";
  const field = (name: string) => ({ name, defaultValue: v[name], error: err[name] });

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-6" noValidate>
      {state?.error && <p role="alert" className="rounded-md border border-red-300 p-3 text-sm text-red-600">{state.error}</p>}
      {Object.keys(err).length > 0 && <p role="alert" className="text-sm text-red-600">Please fix the highlighted fields.</p>}

      <FormSection title="Company">
        <TextField label="Company name" required {...field("company_name")} />
        <TextField label="Industry" {...field("industry")} />
        <TextField label="Website" placeholder="acme.com" {...field("website")} />
        <TextField label="Country" {...field("country")} />
        <TextField label="Timezone" placeholder="America/New_York" {...field("timezone")} />
        <SelectField label="Status" required allowBlank={false} options={CLIENT_STATUSES} {...field("status")} />
        <TextField label="Client since" type="date" {...field("start_date")} />
      </FormSection>

      <ContactsEditor initial={initialContacts(client, state?.values)} error={err.contacts} />

      <FormSection title="Billing">
        <TextField label="Billing email" type="email" {...field("billing_email")} />
        <SelectField label="Currency" required allowBlank={false} options={CURRENCIES} {...field("currency")} />
        <TextField label="Agreed rate" type="number" {...field("rate")} />
        <SelectField label="Rate basis" options={RATE_BASES} {...field("rate_basis")} />
        <SelectField label="Billing cycle" options={BILLING_CYCLES} {...field("billing_cycle")} />
        <TextField label="Payment method" list="payment-options" {...field("payment_method")} />
        <TextAreaField label="Billing address" rows={2} className="sm:col-span-2 lg:col-span-3" {...field("billing_address")} />
        <DataList id="payment-options" options={PAYMENT_SUGGESTIONS} />
      </FormSection>

      <FormSection title="Engagement">
        <TextField label="Services" list="service-options" className="sm:col-span-2" hint="Separate with commas." {...field("services")} />
        <TextField label="Hours per week" type="number" {...field("hours_per_week")} />
        <TextField label="Contract start" type="date" {...field("contract_start")} />
        <TextField label="Contract end" type="date" {...field("contract_end")} />
        <DataList id="service-options" options={SERVICE_SUGGESTIONS} />
      </FormSection>

      <FormSection title="Notes">
        <TextAreaField label="Notes" rows={4} className="sm:col-span-2 lg:col-span-3" {...field("notes")} />
      </FormSection>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : submitLabel}</Button>
        <Button asChild variant="outline"><Link href={cancelHref}>Cancel</Link></Button>
      </div>
    </form>
  );
}
