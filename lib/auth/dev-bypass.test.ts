import { describe, it, expect } from "vitest";
import { authBypassEnabled, DEV_MANAGER } from "./dev-bypass";

describe("authBypassEnabled", () => {
  it("is on in development when AUTH_BYPASS=true", () =>
    expect(authBypassEnabled({ NODE_ENV: "development", AUTH_BYPASS: "true" })).toBe(true));
  it("is never on in production, even when AUTH_BYPASS=true", () =>
    expect(authBypassEnabled({ NODE_ENV: "production", AUTH_BYPASS: "true" })).toBe(false));
  it.each([undefined, "", "false", "1", "TRUE "])("is off for AUTH_BYPASS=%s", (v) =>
    expect(authBypassEnabled({ NODE_ENV: "development", AUTH_BYPASS: v })).toBe(false));
});

it("the bypass identity is a superadmin", () => expect(DEV_MANAGER.isSuperadmin).toBe(true));
