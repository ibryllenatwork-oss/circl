export type LoginErrorCode = "not_manager" | "oauth_failed";

const MESSAGES: Record<LoginErrorCode, string> = {
  not_manager: "This Google account isn't a circl. manager. Ask a superadmin to invite you.",
  oauth_failed: "Google sign-in failed. Try again.",
};

/** Maps the ?error= code on the login page to a message (unknown codes show nothing). */
export function loginErrorMessage(code: string | null): string | null {
  return code && code in MESSAGES ? MESSAGES[code as LoginErrorCode] : null;
}

/** Reads the error Supabase appends to the OAuth callback URL, if any. */
export function oauthErrorCode(params: URLSearchParams): LoginErrorCode | null {
  if (!params.get("error") && !params.get("error_code")) return null;
  const signupDisabled =
    params.get("error_code") === "signup_disabled" ||
    /signups? not allowed/i.test(params.get("error_description") ?? "");
  return signupDisabled ? "not_manager" : "oauth_failed";
}
