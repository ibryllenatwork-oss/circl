import { it, expect } from "vitest";
import { statusTone, expiryTone } from "./status";

it.each([
  ["active", "success"],
  ["on_leave", "pending"],
  ["prospect", "pending"],
  ["paused", "processing"],
  ["terminated", "error"],
  ["resigned", "neutral"],
  ["ended", "neutral"],
  ["something-new", "neutral"],
])("status %s → %s", (s, tone) => expect(statusTone(s)).toBe(tone));

it.each([
  ["expired", "error"],
  ["soon", "pending"],
  ["ok", "neutral"],
] as const)("expiry %s → %s", (s, tone) => expect(expiryTone(s)).toBe(tone));
