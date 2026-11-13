import { describe, it, expect } from "vitest";
import { parseInviteEmail, canRemoveManager, inviteErrorMessage } from "./rules";

describe("parseInviteEmail", () => {
  it("trims and lowercases a valid email", () =>
    expect(parseInviteEmail("  Ana@Circl.PH ")).toEqual({ ok: true, email: "ana@circl.ph" }));
  it.each([undefined, null, 42, "", "   ", "ana", "ana@", "@circl.ph", "a b@circl.ph"])(
    "rejects %s",
    (v) => expect(parseInviteEmail(v)).toEqual({ ok: false, error: "Enter a valid email address." }),
  );
});

describe("canRemoveManager", () => {
  it("allows removing another regular manager", () =>
    expect(canRemoveManager("a", "b", false)).toBe(true));
  it("refuses removing yourself", () => expect(canRemoveManager("a", "a", false)).toBe(false));
  it("refuses removing a superadmin", () => expect(canRemoveManager("a", "b", true)).toBe(false));
  it("refuses empty ids", () => {
    expect(canRemoveManager("a", "", false)).toBe(false);
    expect(canRemoveManager("", "b", false)).toBe(false);
  });
});

describe("inviteErrorMessage", () => {
  it("explains an already-registered email", () =>
    expect(inviteErrorMessage({ code: "email_exists", status: 422 })).toBe(
      "That email already belongs to a manager.",
    ));
  it("recognises the older already-registered message", () =>
    expect(inviteErrorMessage({ message: "A user with this email address has already been registered" })).toBe(
      "That email already belongs to a manager.",
    ));
  it("explains rate limiting", () =>
    expect(inviteErrorMessage({ status: 429 })).toBe(
      "Too many invites sent. Wait a few minutes and try again.",
    ));
  it("falls back to a generic message", () =>
    expect(inviteErrorMessage({ message: "boom" })).toBe("Could not send the invite. Try again."));
});
