const MAX = 120;

/**
 * "Copy of <name>", then "Copy of <name> (2)", (3)… — compared case-insensitively
 * against `taken`, and always shortened so the whole name (with its number) fits.
 */
export function copyName(source: string, taken: string[]): string {
  const used = new Set(taken.map((t) => t.toLowerCase()));
  for (let n = 1; n < 1000; n++) {
    const suffix = n === 1 ? "" : ` (${n})`;
    const room = MAX - "Copy of ".length - suffix.length;
    const candidate = `Copy of ${source.slice(0, room).trimEnd()}${suffix}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return `Copy of ${crypto.randomUUID()}`;
}
