import { it, expect } from "vitest";
import { greeting } from "./greeting";

// Manila is UTC+8 all year (no DST).
const manila = (hhmm: string) => new Date(`2026-11-14T${hhmm}:00+08:00`);

it.each([
  ["00:00", "Good morning"],
  ["11:59", "Good morning"],
  ["12:00", "Good afternoon"],
  ["17:59", "Good afternoon"],
  ["18:00", "Good evening"],
  ["23:59", "Good evening"],
])("%s Manila → %s", (t, expected) => expect(greeting(manila(t))).toBe(expected));

it("uses Manila time, not the server's", () => {
  // 03:30 UTC = 11:30 Manila
  expect(greeting(new Date("2026-11-14T03:30:00Z"))).toBe("Good morning");
  // 04:30 UTC = 12:30 Manila
  expect(greeting(new Date("2026-11-14T04:30:00Z"))).toBe("Good afternoon");
});
