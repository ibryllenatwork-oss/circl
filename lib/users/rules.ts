export type ParsedEmail = { ok: true; email: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalizes an invite email from form input, or explains why it's invalid. */
export function parseInviteEmail(input: unknown): ParsedEmail {
  if (typeof input === "string") {
    const email = input.trim().toLowerCase();
    if (EMAIL_RE.test(email)) return { ok: true, email };
  }
  return { ok: false, error: "Enter a valid email address." };
}

/** A manager may remove anyone except themselves. */
export function canRemoveManager(callerId: string, targetId: string): boolean {
  return Boolean(callerId) && Boolean(targetId) && callerId !== targetId;
}

/** Turns a Supabase invite error into a message a manager can act on. */
export function inviteErrorMessage(err: {
  message?: string;
  status?: number;
  code?: string;
}): string {
  if (err.code === "email_exists" || /already been registered/i.test(err.message ?? "")) {
    return "That email already belongs to a manager.";
  }
  if (err.status === 429 || err.code === "over_email_send_rate_limit") {
    return "Too many invites sent. Wait a few minutes and try again.";
  }
  return "Could not send the invite. Try again.";
}
