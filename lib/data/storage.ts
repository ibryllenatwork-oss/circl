import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";

/** Removes every file under `prefix/` (one level; uploads are flat per owner). */
export async function removeFolder(db: SupabaseClient, prefix: string): Promise<void> {
  const bucket = db.storage.from(DOCUMENTS_BUCKET);
  for (;;) {
    const { data, error } = await bucket.list(prefix, { limit: 100 });
    if (error) throw error;
    const paths = (data ?? []).filter((f) => f.id).map((f) => `${prefix}/${f.name}`);
    if (paths.length === 0) return;
    const { error: removeError } = await bucket.remove(paths);
    if (removeError) throw removeError;
  }
}
