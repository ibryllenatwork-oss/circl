/** Parses the comma-separated SUPERADMIN_EMAILS setting. */
export function parseSuperadminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadmin(email: string | null | undefined, list: string[]): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized !== "" && list.includes(normalized);
}
