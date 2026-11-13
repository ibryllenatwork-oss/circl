import { it, expect } from "vitest";
import { isUuid, pageNumber, searchTerm } from "./action";

it("turns a page param into a safe positive integer", () => {
  expect(pageNumber("3")).toBe(3);
  expect(pageNumber("1.5")).toBe(1);
  expect(pageNumber("-2")).toBe(1);
  expect(pageNumber("abc")).toBe(1);
  expect(pageNumber(undefined)).toBe(1);
  expect(pageNumber("99999999")).toBe(10000);
});

it("recognizes uuids", () => {
  expect(isUuid("3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f")).toBe(true);
  expect(isUuid("CIRCL-0001")).toBe(false);
  expect(isUuid(undefined)).toBe(false);
});

it("cleans search terms for PostgREST filters", () => {
  expect(searchTerm("  Ana  Cruz ")).toBe("Ana Cruz");
  expect(searchTerm("a,b)or(id.eq.1")).toBe("a b or id.eq.1");
  expect(searchTerm("juan.cruz@gmail.com")).toBe("juan.cruz@gmail.com");
  expect(searchTerm("100%*")).toBe("100");
  expect(searchTerm(null)).toBe("");
  expect(searchTerm("x".repeat(300))).toHaveLength(100);
});
