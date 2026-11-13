import { describe, it, expect } from "vitest";
import { loginErrorMessage, oauthErrorCode } from "./login-errors";

describe("oauthErrorCode", () => {
  const p = (q: string) => new URLSearchParams(q);
  it("is null when there is no error", () => expect(oauthErrorCode(p("code=abc"))).toBeNull());
  it("detects disabled sign-ups by error_code", () =>
    expect(oauthErrorCode(p("error=access_denied&error_code=signup_disabled"))).toBe("not_manager"));
  it("detects disabled sign-ups by description", () =>
    expect(
      oauthErrorCode(p("error=server_error&error_description=Signups+not+allowed+for+this+instance")),
    ).toBe("not_manager"));
  it("treats other errors as a failed sign-in", () =>
    expect(oauthErrorCode(p("error=access_denied&error_description=User+cancelled"))).toBe("oauth_failed"));
});

describe("loginErrorMessage", () => {
  it("explains a Google account that isn't a manager", () =>
    expect(loginErrorMessage("not_manager")).toBe(
      "This Google account isn't a circl. manager. Ask a superadmin to invite you.",
    ));
  it("explains a failed Google sign-in", () =>
    expect(loginErrorMessage("oauth_failed")).toBe("Google sign-in failed. Try again."));
  it.each([null, "", "<script>"])("shows nothing for %s", (c) => expect(loginErrorMessage(c)).toBeNull());
});
