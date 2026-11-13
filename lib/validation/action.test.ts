import { it, expect } from "vitest";
import { isUuid, searchTerm } from "./action";

it("recognizes uuids", () => {
  expect(isUuid("3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f")).toBe(true);
  expect(isUuid("CIRCL-0001")).toBe(false);
  expect(isUuid(undefined)).toBe(false);
});

it("cleans search terms for PostgREST filters", () => {
  expect(searchTerm("  Ana  Cruz ")).toBe("Ana Cruz");
  expect(searchTerm("a,b)or(id.eq.1")).toBe("a b or id eq 1");
  expect(searchTerm("100%*")).toBe("100");
  expect(searchTerm(null)).toBe("");
  expect(searchTerm("x".repeat(300))).toHaveLength(100);
});
