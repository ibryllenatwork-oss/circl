"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withManager, UnauthorizedError } from "@/lib/data/db";
import { removeFolder } from "@/lib/data/storage";
import { parseClientForm } from "@/lib/clients/schema";
import { GENERIC_SAVE_ERROR, SESSION_EXPIRED_MESSAGE, isUuid, type FormState } from "@/lib/validation/action";
import { formValues } from "@/lib/validation/form";
import { uniqueViolationField } from "@/lib/validation/ph";
import { todayInManila } from "@/lib/format";

const UNIQUE_FIELDS = { clients_company_name_key: "company_name" };

function failure(err: unknown, values: Record<string, string>): FormState {
  if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE, values };
  const field = uniqueViolationField(err as { code?: string; message?: string }, UNIQUE_FIELDS);
  if (field) return { ok: false, fieldErrors: { [field]: "A client with this company name already exists." }, values };
  if ((err as { message?: string })?.message?.includes("client not found")) {
    return { ok: false, error: "This client no longer exists.", values };
  }
  console.error("client action failed", err);
  return { ok: false, error: GENERIC_SAVE_ERROR, values };
}

/** Create (id = null) or update a client and its contacts in one transaction. */
export async function saveClient(id: string | null, _prev: FormState | null, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (id !== null && !isUuid(id)) return { ok: false, error: GENERIC_SAVE_ERROR, values };
  const parsed = parseClientForm(formData);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };

  let savedId: string;
  try {
    savedId = await withManager(async (db, me) => {
      const { data, error } = await db.rpc("save_client", {
        p_client: { ...parsed.data.client, id },
        p_contacts: parsed.data.contacts,
        p_actor: me.email,
      });
      if (error) throw error;
      return data as string;
    });
  } catch (err) {
    return failure(err, values);
  }
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${savedId}`);
  redirect(`/admin/clients/${savedId}`);
}

export async function deleteClient(id: string, confirmText: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Could not delete. Try again." };
  try {
    const result = await withManager(async (db): Promise<FormState | null> => {
      const { data, error } = await db.from("clients").select("company_name").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "This client no longer exists." };
      if (typeof confirmText !== "string" || confirmText.trim().toLowerCase() !== data.company_name.trim().toLowerCase()) {
        return { ok: false, error: `Type ${data.company_name} to confirm.` };
      }
      await removeFolder(db, `clients/${id}`);
      const { error: deleteError } = await db.from("clients").delete().eq("id", id);
      if (deleteError) throw deleteError;
      return null;
    });
    if (result) return result;
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
    console.error("delete client failed", err);
    return { ok: false, error: "Could not delete. Try again." };
  }
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function assignEmployee(clientId: string, employeeId: string): Promise<FormState> {
  if (!isUuid(clientId) || !isUuid(employeeId)) return { ok: false, error: "Choose a VA to assign." };
  try {
    return await withManager(async (db) => {
      const { data: emp, error: empError } = await db
        .from("employees")
        .select("status")
        .eq("id", employeeId)
        .maybeSingle();
      if (empError) throw empError;
      if (!emp || !["active", "on_leave"].includes(emp.status)) {
        return { ok: false, error: "Only active or on-leave VAs can be assigned." };
      }
      const { error } = await db
        .from("client_assignments")
        .upsert(
          // The database's current_date is UTC; record the Manila date instead.
          { client_id: clientId, employee_id: employeeId, assigned_on: todayInManila() },
          { onConflict: "client_id,employee_id", ignoreDuplicates: true },
        );
      if (error) throw error;
      revalidatePath(`/admin/clients/${clientId}`);
      revalidatePath(`/admin/employees/${employeeId}`);
      revalidatePath("/admin/employees");
      return { ok: true, message: "VA assigned." };
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
    console.error("assign failed", err);
    return { ok: false, error: "Could not assign. Try again." };
  }
}

export async function unassignEmployee(clientId: string, employeeId: string): Promise<FormState> {
  if (!isUuid(clientId) || !isUuid(employeeId)) return { ok: false, error: "Could not remove. Try again." };
  try {
    return await withManager(async (db) => {
      const { error } = await db
        .from("client_assignments")
        .delete()
        .eq("client_id", clientId)
        .eq("employee_id", employeeId);
      if (error) throw error;
      revalidatePath(`/admin/clients/${clientId}`);
      revalidatePath(`/admin/employees/${employeeId}`);
      revalidatePath("/admin/employees");
      return { ok: true, message: "VA removed." };
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
    console.error("unassign failed", err);
    return { ok: false, error: "Could not remove. Try again." };
  }
}
