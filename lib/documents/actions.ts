"use server";

import { revalidatePath } from "next/cache";
import { withManager, UnauthorizedError } from "@/lib/data/db";
import { DOCUMENTS_BUCKET } from "@/lib/data/storage";
import { SESSION_EXPIRED_MESSAGE, isUuid } from "@/lib/validation/action";
import {
  DOC_TABLE,
  DOC_TYPES_BY_OWNER,
  isOwner,
  safeFileName,
  storagePath,
  validateUpload,
  type Owner,
} from "./rules";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(err: unknown, fallback: string): { ok: false; error: string } {
  if (err instanceof UnauthorizedError) return { ok: false, error: SESSION_EXPIRED_MESSAGE };
  console.error(fallback, err);
  return { ok: false, error: fallback };
}

async function ownerExists(db: Parameters<Parameters<typeof withManager>[0]>[0], owner: Owner, id: string) {
  const { data, error } = await db.from(owner).select("id").eq("id", id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** Step 1 of an upload: validate, then hand the browser a one-time signed upload URL. */
export async function createUploadUrl(
  owner: Owner,
  ownerId: string,
  file: { name: string; size: number; type: string },
  kind: "document" | "photo",
): Promise<Result<{ path: string; token: string }>> {
  if (!isOwner(owner) || !isUuid(ownerId) || !file || typeof file.name !== "string") {
    return { ok: false, error: "Upload not allowed." };
  }
  if (kind === "photo" && owner !== "employees") return { ok: false, error: "Upload not allowed." };
  const invalid = validateUpload({ size: Number(file.size), type: String(file.type) }, kind);
  if (invalid) return { ok: false, error: invalid };

  try {
    return await withManager(async (db) => {
      if (!(await ownerExists(db, owner, ownerId))) return { ok: false, error: "This record no longer exists." };
      const ext = safeFileName(file.name).split(".").pop();
      const path =
        kind === "photo" ? `${owner}/${ownerId}/photo-${crypto.randomUUID()}.${ext}` : storagePath(owner, ownerId, file.name);
      const { data, error } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
      if (error) throw error;
      return { ok: true, path: data.path, token: data.token };
    });
  } catch (err) {
    return fail(err, "Could not start the upload. Try again.");
  }
}

/** Step 2: after the browser uploaded the file, record it. */
export async function recordDocument(
  owner: Owner,
  ownerId: string,
  meta: {
    path: string;
    doc_type: string;
    label?: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    expires_on?: string;
  },
): Promise<Result> {
  if (!isOwner(owner) || !isUuid(ownerId) || !meta) return { ok: false, error: "Upload not allowed." };
  if (typeof meta.path !== "string" || !meta.path.startsWith(`${owner}/${ownerId}/`) || meta.path.includes("/photo-")) {
    return { ok: false, error: "Upload not allowed." };
  }
  if (!DOC_TYPES_BY_OWNER[owner].includes(meta.doc_type)) return { ok: false, error: "Choose a document type." };
  if (meta.expires_on && !ISO_DATE.test(meta.expires_on)) return { ok: false, error: "Enter a valid expiry date." };

  const { table, fk } = DOC_TABLE[owner];
  try {
    return await withManager(async (db, me) => {
      const { error } = await db.from(table).insert({
        [fk]: ownerId,
        doc_type: meta.doc_type,
        label: meta.label?.trim().slice(0, 200) || null,
        file_path: meta.path,
        file_name: String(meta.file_name).slice(0, 255),
        mime_type: String(meta.mime_type).slice(0, 100),
        size_bytes: Number(meta.size_bytes) || null,
        expires_on: meta.expires_on || null,
        created_by: me.email,
      });
      if (error) throw error;
      revalidatePath(`/admin/${owner}/${ownerId}`);
      return { ok: true };
    });
  } catch (err) {
    return fail(err, "Could not save the document. Try again.");
  }
}

/** A 60-second link to view a document. */
export async function documentDownloadUrl(owner: Owner, docId: string): Promise<Result<{ url: string }>> {
  if (!isOwner(owner) || !isUuid(docId)) return { ok: false, error: "Document not found." };
  const { table } = DOC_TABLE[owner];
  try {
    return await withManager(async (db) => {
      const { data, error } = await db.from(table).select("file_path").eq("id", docId).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "Document not found." };
      const { data: signed, error: signError } = await db.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(data.file_path, 60);
      if (signError) throw signError;
      return { ok: true, url: signed.signedUrl };
    });
  } catch (err) {
    return fail(err, "Could not open the document. Try again.");
  }
}

export async function deleteDocument(owner: Owner, docId: string): Promise<Result> {
  if (!isOwner(owner) || !isUuid(docId)) return { ok: false, error: "Document not found." };
  const { table, fk } = DOC_TABLE[owner];
  try {
    return await withManager(async (db) => {
      const { data, error } = await db.from(table).select(`file_path, ${fk}`).eq("id", docId).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "Document not found." };
      const row = data as unknown as Record<string, string>;
      const { error: removeError } = await db.storage.from(DOCUMENTS_BUCKET).remove([row.file_path]);
      if (removeError) throw removeError;
      const { error: deleteError } = await db.from(table).delete().eq("id", docId);
      if (deleteError) throw deleteError;
      revalidatePath(`/admin/${owner}/${row[fk]}`);
      return { ok: true };
    });
  } catch (err) {
    return fail(err, "Could not delete the document. Try again.");
  }
}

/** Saves an uploaded photo as the employee's photo and removes the previous one. */
export async function setEmployeePhoto(employeeId: string, path: string): Promise<Result> {
  if (!isUuid(employeeId) || typeof path !== "string" || !path.startsWith(`employees/${employeeId}/photo-`)) {
    return { ok: false, error: "Upload not allowed." };
  }
  try {
    return await withManager(async (db, me) => {
      const { data, error } = await db.from("employees").select("photo_path").eq("id", employeeId).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "This employee no longer exists." };
      const { error: updateError } = await db
        .from("employees")
        .update({ photo_path: path, updated_by: me.email })
        .eq("id", employeeId);
      if (updateError) throw updateError;
      if (data.photo_path && data.photo_path !== path) {
        await db.storage.from(DOCUMENTS_BUCKET).remove([data.photo_path]);
      }
      revalidatePath(`/admin/employees/${employeeId}`);
      return { ok: true };
    });
  } catch (err) {
    return fail(err, "Could not save the photo. Try again.");
  }
}
