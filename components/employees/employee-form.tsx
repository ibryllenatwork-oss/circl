"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFocusFirstError } from "@/components/admin/use-focus-first-error";
import { Button } from "@/components/ui/button";
import {
  DataList,
  FormActions,
  FormAlert,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/form-fields";
import {
  CIVIL_STATUSES,
  EDUCATION_LEVELS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  PAYOUT_SUGGESTIONS,
  POSITION_SUGGESTIONS,
  RATE_BASES,
  SEXES,
} from "@/lib/employees/labels";
import type { EmployeeRow } from "@/lib/employees/queries";
import type { FormState } from "@/lib/validation/action";

type Action = (prev: FormState | null, formData: FormData) => Promise<FormState>;

function initialValues(e: Partial<EmployeeRow> | null): Record<string, string> {
  if (!e) return { status: "active", nationality: "Filipino", timezone: "Asia/Manila", employment_type: "full_time" };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e)) {
    if (v == null) continue;
    out[k] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  return out;
}

export function EmployeeForm({
  action,
  employee,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  employee: Partial<EmployeeRow> | null;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const v = state?.values ?? initialValues(employee);
  const err = state?.fieldErrors ?? {};
  // Re-mount after each result so defaults reflect what was submitted.
  const formKey = state ? JSON.stringify([state.values, state.fieldErrors, state.error]) : "initial";
  const field = (name: string) => ({ name, defaultValue: v[name], error: err[name] });

  const formRef = useFocusFirstError(formKey);

  return (
    <form ref={formRef} key={formKey} action={formAction} className="flex flex-col gap-6" noValidate>
      {state?.error && <FormAlert message={state.error} />}
      {Object.keys(err).length > 0 && <FormAlert message="Please fix the highlighted fields below." />}

      <FormSection title="Personal" description="Identity and contact details.">

        <TextField label="First name" required {...field("first_name")} />
        <TextField label="Middle name" {...field("middle_name")} />
        <TextField label="Last name" required {...field("last_name")} />
        <TextField label="Suffix" placeholder="Jr., III" {...field("suffix")} />
        <TextField label="Nickname" {...field("nickname")} />
        <TextField label="Birth date" type="date" {...field("birth_date")} />
        <SelectField label="Sex" options={SEXES} {...field("sex")} />
        <SelectField label="Civil status" options={CIVIL_STATUSES} {...field("civil_status")} />
        <TextField label="Nationality" {...field("nationality")} />
        <TextField label="Personal email" type="email" required {...field("personal_email")} />
        <TextField label="Mobile" placeholder="0917 123 4567" {...field("mobile")} />
        <div className="hidden lg:block" />
        <TextAreaField label="Current address" rows={2} className="sm:col-span-2 lg:col-span-3" {...field("current_address")} />
        <TextAreaField label="Permanent address" rows={2} className="sm:col-span-2 lg:col-span-3" {...field("permanent_address")} />
      </FormSection>

      <FormSection title="Government IDs" description="Formatted automatically; shown masked on the record.">
        <TextField label="SSS no." placeholder="34-1234567-8" {...field("sss_no")} />
        <TextField label="PhilHealth no." placeholder="12-345678901-2" {...field("philhealth_no")} />
        <TextField label="Pag-IBIG no." placeholder="1234-5678-9012" {...field("pagibig_no")} />
        <TextField label="TIN" placeholder="123-456-789" {...field("tin")} />
      </FormSection>

      <FormSection title="Employment" description="Role, status, schedule and rate.">
        <TextField label="Position" required list="position-options" {...field("position")} />
        <SelectField label="Employment type" required allowBlank={false} options={EMPLOYMENT_TYPES} {...field("employment_type")} />
        <SelectField label="Status" required allowBlank={false} options={EMPLOYEE_STATUSES} {...field("status")} />
        <TextField label="Date hired" type="date" required hint="For a rehire, enter the new hire date." {...field("date_hired")} />
        <TextField label="Date separated" type="date" hint="Only for resigned or terminated." {...field("date_separated")} />
        <TextField label="Work schedule" placeholder="Mon–Fri 9pm–6am" {...field("work_schedule")} />
        <TextField label="Timezone" placeholder="Asia/Manila" {...field("timezone")} />
        <TextField label="Rate (PHP)" type="number" {...field("rate")} />
        <SelectField label="Rate basis" options={RATE_BASES} {...field("rate_basis")} />
        <TextField label="Skills and tools" placeholder="Canva, GoHighLevel, QuickBooks" className="sm:col-span-2 lg:col-span-3" hint="Separate with commas." {...field("skills")} />
        <DataList id="position-options" options={POSITION_SUGGESTIONS} />
      </FormSection>

      <FormSection title="Payout" description="Where salary is sent.">
        <TextField label="Bank or e-wallet" list="payout-options" {...field("payout_method")} />
        <TextField label="Account name" {...field("payout_account_name")} />
        <TextField label="Account number" {...field("payout_account_no")} />
        <DataList id="payout-options" options={PAYOUT_SUGGESTIONS} />
      </FormSection>

      <FormSection title="Emergency contact" description="Who to call if something happens.">
        <TextField label="Name" {...field("emergency_name")} />
        <TextField label="Relationship" {...field("emergency_relationship")} />
        <TextField label="Mobile" placeholder="0917 123 4567" {...field("emergency_mobile")} />
      </FormSection>

      <FormSection title="Education">
        <SelectField label="Highest attainment" options={EDUCATION_LEVELS} {...field("education_attainment")} />
        <TextField label="School" {...field("education_school")} />
        <TextField label="Course" {...field("education_course")} />
      </FormSection>

      <FormSection title="Notes" description="Private HR notes for managers.">
        <TextAreaField label="HR notes" rows={4} className="sm:col-span-2 lg:col-span-3" {...field("notes")} />
      </FormSection>

      <FormActions>
        <Button asChild variant="secondary">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </FormActions>
    </form>
  );
}
