"use client";

import { createClient } from "@/lib/supabase/client";
import { createUploadUrl } from "./actions";
import { validateUpload, type Owner } from "./rules";

/** Validates, gets a signed upload URL from the server, then uploads straight to Storage. */
export async function uploadFile(
  owner: Owner,
  ownerId: string,
  file: File,
  kind: "document" | "photo",
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const invalid = validateUpload(file, kind);
  if (invalid) return { ok: false, error: invalid };

  const signed = await createUploadUrl(owner, ownerId, { name: file.name, size: file.size, type: file.type }, kind);
  if (!signed.ok) return signed;

  const { error } = await createClient()
    .storage.from("documents")
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
  if (error) return { ok: false, error: "Upload failed. Check your connection and try again." };
  return { ok: true, path: signed.path };
}
