"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withManager, UnauthorizedError } from "@/lib/data/db";
import { PACKAGE_STATUSES, parsePackageForm, parseRatesForm, parseServiceForm, type PackageStatus } from "@/lib/services/schema";
import { copyName } from "@/lib/services/copy-name";
import { serviceDbError } from "@/lib/services/errors";
import { GENERIC_SAVE_ERROR, SESSION_EXPIRED_MESSAGE, isUuid, type FormState } from "@/lib/validation/action";
import { formValues } from "@/lib/validation/form";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const CATALOG = "/admin/services";
const PACKAGES = "/admin/services/packages";

function formFailure(err: unknown, values: Record<string, string>): FormState {
  if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE, values };
  const mapped = serviceDbError(err as { code?: string; message?: string });
  if (mapped) {
    return mapped.field === "_form"
      ? { ok: false, error: mapped.message, values }
      : { ok: false, fieldErrors: { [mapped.field]: mapped.message }, values };
  }
  console.error("services action failed", err);
  return { ok: false, error: GENERIC_SAVE_ERROR, values };
}

function failure(err: unknown, fallback: string): Result {
  if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
  const mapped = serviceDbError(err as { code?: string; message?: string });
  if (mapped) return { ok: false, error: mapped.message };
  console.error(fallback, err);
  return { ok: false, error: fallback };
}

// ----------------------------------------------------------------- services

/** Create (id = null) or edit a service or subservice. */
export async function saveService(id: string | null, _prev: FormState | null, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (id !== null && !isUuid(id)) return { ok: false, error: GENERIC_SAVE_ERROR, values };
  const parsed = parseServiceForm(formData);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };
  if (id && parsed.data.parent_id === id) {
    return { ok: false, fieldErrors: { parent_id: "A service can't be its own parent." }, values };
  }

  try {
    await withManager(async (db, me) => {
      if (id) {
        const { error } = await db
          .from("services")
          .update({ ...parsed.data, updated_by: me.email })
          .eq("id", id);
        if (error) throw error;
      } else {
        let siblings = db.from("services").select("position").order("position", { ascending: false }).limit(1);
        siblings = parsed.data.parent_id ? siblings.eq("parent_id", parsed.data.parent_id) : siblings.is("parent_id", null);
        const { data: last, error: posError } = await siblings;
        if (posError) throw posError;
        const position = (last?.[0]?.position ?? -1) + 1;
        const { error } = await db
          .from("services")
          .insert({ ...parsed.data, position, created_by: me.email, updated_by: me.email });
        if (error) throw error;
      }
    });
  } catch (err) {
    return formFailure(err, values);
  }
  revalidatePath(CATALOG);
  return { ok: true, message: id ? "Service updated." : "Service added." };
}

/** Swap a service with its previous/next sibling. */
export async function moveService(id: string, direction: "up" | "down"): Promise<Result> {
  if (!isUuid(id) || (direction !== "up" && direction !== "down")) return { ok: false, error: "Could not move." };
  try {
    await withManager(async (db, me) => {
      const { data: self, error } = await db.from("services").select("id, parent_id").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!self) return;
      let q = db.from("services").select("id, position, name").order("position").order("name");
      q = self.parent_id ? q.eq("parent_id", self.parent_id) : q.is("parent_id", null);
      const { data: siblings, error: sibError } = await q;
      if (sibError) throw sibError;
      const list = siblings ?? [];
      const i = list.findIndex((s) => s.id === id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      // Renumber the whole sibling group so positions stay tidy.
      for (const [position, s] of list.entries()) {
        const { error: updError } = await db.from("services").update({ position, updated_by: me.email }).eq("id", s.id);
        if (updError) throw updError;
      }
    });
  } catch (err) {
    return failure(err, "Could not move the service.");
  }
  revalidatePath(CATALOG);
  return { ok: true };
}

export async function setServiceActive(id: string, active: boolean): Promise<Result> {
  if (!isUuid(id) || typeof active !== "boolean") return { ok: false, error: "Could not update." };
  try {
    await withManager(async (db, me) => {
      const { error } = await db.from("services").update({ active, updated_by: me.email }).eq("id", id);
      if (error) throw error;
    });
  } catch (err) {
    return failure(err, "Could not update the service.");
  }
  revalidatePath(CATALOG);
  revalidatePath(PACKAGES);
  return { ok: true, message: active ? "Service restored." : "Service archived." };
}

export async function deleteService(id: string): Promise<Result> {
  if (!isUuid(id)) return { ok: false, error: "Could not delete." };
  try {
    await withManager(async (db) => {
      const { error } = await db.from("services").delete().eq("id", id);
      if (error) throw error;
    });
  } catch (err) {
    return failure(err, "Could not delete the service.");
  }
  revalidatePath(CATALOG);
  return { ok: true, message: "Service deleted." };
}

// -------------------------------------------------------------------- rates

export async function saveRates(serviceId: string, _prev: FormState | null, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (!isUuid(serviceId)) return { ok: false, error: GENERIC_SAVE_ERROR, values };
  const parsed = parseRatesForm(formData);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };
  try {
    await withManager(async (db, me) => {
      const { error } = await db.rpc("save_service_rates", {
        p_service_id: serviceId,
        p_rates: parsed.data.map((r) => ({
          tier: r.tier,
          client_rate: r.client_rate == null ? "" : String(r.client_rate),
          va_rate: r.va_rate == null ? "" : String(r.va_rate),
        })),
        p_actor: me.email,
      });
      if (error) throw error;
    });
  } catch (err) {
    return formFailure(err, values);
  }
  revalidatePath(CATALOG);
  revalidatePath(PACKAGES);
  return { ok: true, message: "Rates saved." };
}

export async function clearRates(serviceId: string): Promise<Result> {
  if (!isUuid(serviceId)) return { ok: false, error: "Could not clear rates." };
  try {
    await withManager(async (db) => {
      const { error } = await db.from("service_rates").delete().eq("service_id", serviceId);
      if (error) throw error;
    });
  } catch (err) {
    return failure(err, "Could not clear the rates.");
  }
  revalidatePath(CATALOG);
  revalidatePath(PACKAGES);
  return { ok: true, message: "Rates cleared." };
}

// ----------------------------------------------------------------- packages

export async function savePackage(id: string | null, _prev: FormState | null, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (id !== null && !isUuid(id)) return { ok: false, error: GENERIC_SAVE_ERROR, values };
  const parsed = parsePackageForm(formData);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors, values };

  let savedId: string;
  try {
    savedId = await withManager(async (db, me) => {
      const { data, error } = await db.rpc("save_package", {
        p_package: {
          ...parsed.data.package,
          monthly_amount: String(parsed.data.package.monthly_amount),
          id,
        },
        p_lines: parsed.data.lines.map((l) => ({ ...l, hours_per_month: String(l.hours_per_month) })),
        p_actor: me.email,
      });
      if (error) throw error;
      return data as string;
    });
  } catch (err) {
    if ((err as { message?: string })?.message?.includes("package not found")) {
      return { ok: false, error: "This package no longer exists.", values };
    }
    return formFailure(err, values);
  }
  revalidatePath(PACKAGES);
  redirect(`${PACKAGES}/${savedId}?saved=1`);
}

/** Copies a package (lines included) as a Draft named "Copy of …" and opens the copy. */
export async function duplicatePackage(id: string): Promise<Result> {
  if (!isUuid(id)) return { ok: false, error: "Could not duplicate." };
  let newId: string | null = null;
  try {
    newId = await withManager(async (db, me) => {
      const { data: src, error } = await db
        .from("packages")
        .select("name, description, notes, monthly_amount, package_lines(service_id, tier, hours_per_month, position)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!src) return null;
      const lines = [...(src.package_lines as { service_id: string; tier: string; hours_per_month: number; position: number }[])]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ service_id: l.service_id, tier: l.tier, hours_per_month: String(l.hours_per_month) }));
      // Exact-name comparison (no LIKE patterns); retry if another copy lands first.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: names, error: namesError } = await db.from("packages").select("name");
        if (namesError) throw namesError;
        const name = copyName(src.name, (names ?? []).map((n) => n.name as string));
        const { data: copyId, error: saveError } = await db.rpc("save_package", {
          p_package: { name, description: src.description, notes: src.notes, monthly_amount: String(src.monthly_amount), status: "draft" },
          p_lines: lines,
          p_actor: me.email,
        });
        if (!saveError) return copyId as string;
        if (saveError.code !== "23505") throw saveError;
      }
      throw new Error("Could not find a free name for the copy.");
    });
  } catch (err) {
    return failure(err, "Could not duplicate the package.");
  }
  if (!newId) return { ok: false, error: "This package no longer exists." };
  revalidatePath(PACKAGES);
  redirect(`${PACKAGES}/${newId}?saved=1`);
}

const STATUS_MESSAGES: Record<PackageStatus, string> = {
  draft: "Moved to drafts.",
  active: "Package is now active.",
  archived: "Package archived.",
};

export async function setPackageStatus(id: string, status: PackageStatus): Promise<Result> {
  if (!isUuid(id) || !(PACKAGE_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Could not update." };
  try {
    await withManager(async (db, me) => {
      const { error } = await db.from("packages").update({ status, updated_by: me.email }).eq("id", id);
      if (error) throw error;
    });
  } catch (err) {
    return failure(err, "Could not update the package.");
  }
  revalidatePath(PACKAGES);
  return { ok: true, message: STATUS_MESSAGES[status] };
}

export async function deletePackage(id: string): Promise<Result> {
  if (!isUuid(id)) return { ok: false, error: "Could not delete." };
  try {
    await withManager(async (db) => {
      const { error } = await db.from("packages").delete().eq("id", id);
      if (error) throw error;
    });
  } catch (err) {
    return failure(err, "Could not delete the package.");
  }
  revalidatePath(PACKAGES);
  return { ok: true, message: "Package deleted." };
}
