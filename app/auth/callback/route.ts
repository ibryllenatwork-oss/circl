import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/paths";
import { oauthErrorCode } from "@/lib/auth/login-errors";

/** Google (OAuth) sign-in lands here; exchanges the code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const toLogin = (code: string) => NextResponse.redirect(`${origin}/auth/login?error=${code}`);

  const errorCode = oauthErrorCode(searchParams);
  if (errorCode) return toLogin(errorCode);

  const code = searchParams.get("code");
  if (!code) return toLogin("oauth_failed");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return toLogin(/signups? not allowed/i.test(error.message) ? "not_manager" : "oauth_failed");
  }

  return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
}
