"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withManager, UnauthorizedError } from "@/lib/data/db";
import { removeFolder } from "@/lib/data/storage";
import { isRehire, parseEmployeeForm, type PreviousEmployment } from "@/lib/employees/schema";
import {
  GENERIC_SAVE_ERROR,
  SESSION_EXPIRED_MESSAGE,
  isUuid,
  type FormState,
} from "@/lib/validation/action";
import { formValues } from "@/lib/validation/form";
import { uniqueViolationField } from "@/lib/validation/ph";

const UNIQUE_FIELDS = { employees_personal_email_key: "personal_email" };
const DUPLICATE_EMAIL = "Another employee already uses this email.";

function failure(err: unknown, values: Record<string, string>): FormState {
  if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE, values };
  if ((err as { message?: string })?.message?.startsWith("assigned_va_to_admin")) {
    return {
      ok: false,
      fieldErrors: { employee_type: "This VA is assigned to clients. Remove them from their clients before making them an admin." },
      values,
    };
  }
  const field = uniqueViolationField(err as { code?: string; message?: string }, UNIQUE_FIELDS);
  if (field) return { ok: false, fieldErrors: { [field]: DUPLICATE_EMAIL }, values };
  console.error("employee action failed", err);
  return { ok: false, error: GENERIC_SAVE_ERROR, values };
}

export async function createEmployee(_prev: FormState | null, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = parseEmployeeForm(formData);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };

  let id: string;
  try {
    id = await withManager(async (db, me) => {
      const { data, error } = await db
        .from("employees")
        .insert({ ...parsed.data, created_by: me.email, updated_by: me.email })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    });
  } catch (err) {
    return failure(err, values);
  }
  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${id}?saved=1`);
}

export async function updateEmployee(
  id: string,
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  if (!isUuid(id)) return { ok: false, error: GENERIC_SAVE_ERROR, values };

  try {
    const result = await withManager(async (db, me): Promise<FormState | null> => {
      const { data: current, error: readError } = await db
        .from("employees")
        .select("status, date_hired, date_separated")
        .eq("id", id)
        .maybeSingle();
      if (readError) throw readError;
      if (!current) return { ok: false, error: "This employee no longer exists.", values };

      const previous = current as PreviousEmployment;
      const parsed = parseEmployeeForm(formData, { previous });
      if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };

      const { status, date_hired, date_separated, ...rest } = parsed.data;
      if (isRehire(previous.status, status)) {
        // Save the other fields first: if that fails (e.g. duplicate email) nothing
        // has been rehired. Then the rpc moves the old stint to history and
        // reactivates in one transaction.
        const { error } = await db.from("employees").update({ ...rest, updated_by: me.email }).eq("id", id);
        if (error) throw error;
        const { error: rehireError } = await db.rpc("rehire_employee", {
          p_employee_id: id,
          p_date_hired: date_hired,
          p_status: status,
          p_updated_by: me.email,
        });
        if (rehireError) throw rehireError;
      } else {
        const { error } = await db
          .from("employees")
          .update({ ...rest, status, date_hired, date_separated, updated_by: me.email })
          .eq("id", id);
        if (error) throw error;
      }
      return null;
    });
    if (result) return result;
  } catch (err) {
    return failure(err, values);
  }
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  redirect(`/admin/employees/${id}?saved=1`);
}

export async function deleteEmployee(id: string, confirmText: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Could not delete. Try again." };
  try {
    const result = await withManager(async (db): Promise<FormState | null> => {
      const { data, error } = await db.from("employees").select("employee_no").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "This employee no longer exists." };
      if (typeof confirmText !== "string" || confirmText.trim().toUpperCase() !== data.employee_no) {
        return { ok: false, error: `Type ${data.employee_no} to confirm.` };
      }
      // Row first: if it fails, the files are untouched. Leftover files are the cheaper failure.
      const { error: deleteError } = await db.from("employees").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await removeFolder(db, `employees/${id}`).catch((e) => console.error("employee files not removed", id, e));
      return null;
    });
    if (result) return result;
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
    console.error("delete employee failed", err);
    return { ok: false, error: "Could not delete. Try again." };
  }
  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}
