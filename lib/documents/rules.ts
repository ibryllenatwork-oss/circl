const MB = 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * MB;
export const MAX_PHOTO_BYTES = 5 * MB;

export const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type Owner = "employees" | "clients";
export const isOwner = (v: unknown): v is Owner => v === "employees" || v === "clients";

export const DOC_TYPES_BY_OWNER: Record<Owner, readonly string[]> = {
  employees: ["resume", "government_id", "nbi_clearance", "contract", "nda", "other"],
  clients: ["contract", "nda", "sow", "other"],
};

export const DOC_TABLE: Record<Owner, { table: string; fk: string }> = {
  employees: { table: "employee_documents", fk: "employee_id" },
  clients: { table: "client_documents", fk: "client_id" },
};

export function validateUpload(file: { size: number; type: string }, kind: "document" | "photo"): string | null {
  const types: readonly string[] = kind === "photo" ? PHOTO_TYPES : DOCUMENT_TYPES;
  const max = kind === "photo" ? MAX_PHOTO_BYTES : MAX_DOCUMENT_BYTES;
  if (!types.includes(file.type)) {
    return kind === "photo" ? "Photos must be JPG, PNG or WEBP." : "Upload a PDF, JPG, PNG or WEBP file.";
  }
  if (!file.size) return "That file is empty.";
  if (file.size > max) return `Files must be ${max / MB} MB or smaller.`;
  return null;
}

/** Lowercase, ASCII, dash-separated name with its extension; never a path. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 75);
  return `${stem || "file"}${ext ? `.${ext}` : ""}`;
}

export function storagePath(owner: Owner, ownerId: string, fileName: string): string {
  return `${owner}/${ownerId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}
