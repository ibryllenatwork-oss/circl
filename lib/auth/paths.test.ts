import { describe, it, expect } from "vitest";
import { isProtectedPath, safeNext } from "./paths";

describe("isProtectedPath", () => {
  it.each(["/admin", "/admin/", "/admin/users"])("protects %s", (p) =>
    expect(isProtectedPath(p)).toBe(true));
  it.each(["/", "/auth/login", "/administrator", "/about"])("allows %s", (p) =>
    expect(isProtectedPath(p)).toBe(false));
});

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/admin/users")).toBe("/admin/users");
    expect(safeNext("/auth/update-password")).toBe("/auth/update-password");
  });
  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "admin"])(
    "falls back to /admin for %s", (v) => expect(safeNext(v)).toBe("/admin"));
});
