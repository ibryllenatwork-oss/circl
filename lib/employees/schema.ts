import { z } from "zod";
import {
  formValues,
  optionalAmount,
  optionalDate,
  optionalEnum,
  optionalText,
  requiredDate,
  requiredEmail,
  requiredEnum,
  requiredText,
  tags,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/form";
import {
  optionalPagIbig,
  optionalPhilHealth,
  optionalPHMobile,
  optionalSSS,
  optionalTIN,
} from "@/lib/validation/ph";
import {
  CIVIL_STATUSES,
  EDUCATION_LEVELS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  RATE_BASES,
  SEXES,
  type EmployeeStatus,
} from "./labels";

const SEPARATED: readonly string[] = ["resigned", "terminated"];

export const employeeFormSchema = z
  .object({
    first_name: requiredText("First name is required."),
    middle_name: optionalText,
    last_name: requiredText("Last name is required."),
    suffix: optionalText,
    nickname: optionalText,
    birth_date: optionalDate,
    sex: optionalEnum(SEXES),
    civil_status: optionalEnum(CIVIL_STATUSES),
    nationality: optionalText,
    personal_email: requiredEmail,
    mobile: optionalPHMobile,
    current_address: optionalText,
    permanent_address: optionalText,

    sss_no: optionalSSS,
    philhealth_no: optionalPhilHealth,
    pagibig_no: optionalPagIbig,
    tin: optionalTIN,

    position: requiredText("Position is required."),
    employment_type: requiredEnum(EMPLOYMENT_TYPES, "Choose an employment type."),
    status: requiredEnum(EMPLOYEE_STATUSES, "Choose a status."),
    date_hired: requiredDate("Date hired is required."),
    date_separated: optionalDate,
    work_schedule: optionalText,
    timezone: optionalText,
    rate: optionalAmount(9_999_999),
    rate_basis: optionalEnum(RATE_BASES),
    skills: tags,

    payout_method: optionalText,
    payout_account_name: optionalText,
    payout_account_no: optionalText,

    emergency_name: optionalText,
    emergency_relationship: optionalText,
    emergency_mobile: optionalPHMobile,

    education_attainment: optionalEnum(EDUCATION_LEVELS),
    education_school: optionalText,
    education_course: optionalText,

    notes: optionalText,
  })
  .superRefine((e, ctx) => {
    if (SEPARATED.includes(e.status)) {
      if (!e.date_separated) {
        ctx.addIssue({ code: "custom", path: ["date_separated"], message: "Enter the separation date." });
      } else if (e.date_separated < e.date_hired) {
        ctx.addIssue({
          code: "custom",
          path: ["date_separated"],
          message: "Separation date can't be before the hire date.",
        });
      }
    }
  })
  .transform((e) => ({
    ...e,
    // Only separated employees keep a separation date.
    date_separated: SEPARATED.includes(e.status) ? e.date_separated : null,
  }));

export type EmployeeInput = z.infer<typeof employeeFormSchema>;

export type PreviousEmployment = {
  status: EmployeeStatus;
  date_hired: string;
  date_separated: string | null;
};

/** True when a separated employee is being brought back (same 201 file). */
export function isRehire(prev: EmployeeStatus, next: EmployeeStatus): boolean {
  return SEPARATED.includes(prev) && !SEPARATED.includes(next);
}

export function parseEmployeeForm(
  fd: FormData,
  opts: { previous?: PreviousEmployment } = {},
): { ok: true; data: EmployeeInput } | { ok: false; fieldErrors: FieldErrors } {
  const parsed = employeeFormSchema.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const prev = opts.previous;
  if (prev && isRehire(prev.status, parsed.data.status)) {
    const after = prev.date_separated ?? prev.date_hired;
    if (parsed.data.date_hired <= after) {
      return {
        ok: false,
        fieldErrors: {
          date_hired: "This is a rehire: enter the new hire date (after the last separation date).",
        },
      };
    }
  }
  return { ok: true, data: parsed.data };
}
