import { it, expect } from "vitest";
import { copyName } from "./copy-name";

it("prefixes Copy of", () => expect(copyName("Starter", [])).toBe("Copy of Starter"));

it("numbers repeats, comparing names case-insensitively", () => {
  expect(copyName("Starter", ["copy of starter"])).toBe("Copy of Starter (2)");
  expect(copyName("Starter", ["Copy of Starter", "Copy of Starter (2)"])).toBe("Copy of Starter (3)");
});

it("always fits in 120 characters, keeping the number", () => {
  const long = "x".repeat(118);
  const first = copyName(long, []);
  expect(first.length).toBeLessThanOrEqual(120);
  const second = copyName(long, [first]);
  expect(second.length).toBeLessThanOrEqual(120);
  expect(second.endsWith(" (2)")).toBe(true);
  expect(second).not.toBe(first);
});
