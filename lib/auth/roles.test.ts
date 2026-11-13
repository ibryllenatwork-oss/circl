import { describe, it, expect } from "vitest";
import { parseSuperadminEmails, isSuperadmin } from "./roles";

describe("parseSuperadminEmails", () => {
  it("splits, trims, lowercases and drops blanks", () =>
    expect(parseSuperadminEmails(" A@x.com , b@y.com ,")).toEqual(["a@x.com", "b@y.com"]));
  it.each([undefined, "", "  ,  "])("is empty for %s", (raw) =>
    expect(parseSuperadminEmails(raw)).toEqual([]));
});

describe("isSuperadmin", () => {
  const list = ["a@x.com"];
  it("matches ignoring case and spaces", () => expect(isSuperadmin(" A@X.com ", list)).toBe(true));
  it("rejects others", () => expect(isSuperadmin("b@x.com", list)).toBe(false));
  it.each([null, undefined, ""])("rejects %s", (e) => expect(isSuperadmin(e, list)).toBe(false));
  it("is false when no superadmins are configured", () =>
    expect(isSuperadmin("a@x.com", [])).toBe(false));
});
