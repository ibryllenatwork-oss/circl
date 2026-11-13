import "server-only";
import { withManager } from "@/lib/data/db";
import { DOCUMENTS_BUCKET } from "@/lib/data/storage";

/** Short-lived (5 min) URL for showing an employee photo on a page. */
export async function photoUrl(path: string): Promise<string | null> {
  return withManager(async (db) => {
    const { data, error } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, 300);
    return error ? null : data.signedUrl;
  });
}
