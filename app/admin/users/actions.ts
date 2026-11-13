"use server";

import { revalidatePath } from "next/cache";
import { requireManager, superadminEmails } from "@/lib/auth/require-manager";
import { isSuperadmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRemoveManager, inviteErrorMessage, parseInviteEmail } from "@/lib/users/rules";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const SESSION_EXPIRED: ActionResult = {
  ok: false,
  error: "Your session expired. Sign in again.",
};

const NOT_SUPERADMIN: ActionResult = {
  ok: false,
  error: "Only a superadmin can manage users.",
};

export async function inviteManager(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireManager();
  if (!me) return SESSION_EXPIRED;
  if (!me.isSuperadmin) return NOT_SUPERADMIN;

  const parsed = parseInviteEmail(formData.get("email"));
  if (!parsed.ok) return parsed;

  // The invite link itself comes from Supabase's "Invite user" email
  // template, which points at {{ .SiteURL }}/auth/confirm (see docs/supabase-setup.md).
  try {
    const { error } = await createAdminClient().auth.admin.inviteUserByEmail(parsed.email);
    if (error) return { ok: false, error: inviteErrorMessage(error) };
  } catch {
    return { ok: false, error: inviteErrorMessage({}) };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `Invite sent to ${parsed.email}.` };
}

export async function removeManager(userId: string): Promise<ActionResult> {
  const me = await requireManager();
  if (!me) return SESSION_EXPIRED;
  if (!me.isSuperadmin) return NOT_SUPERADMIN;

  if (typeof userId !== "string" || !userId) {
    return { ok: false, error: "Could not remove that manager. Try again." };
  }
  if (userId === me.id) return { ok: false, error: "You can't remove your own account." };

  try {
    const admin = createAdminClient();
    const { data, error: lookupError } = await admin.auth.admin.getUserById(userId);
    if (lookupError || !data.user) throw lookupError ?? new Error("not found");

    const targetIsSuperadmin = isSuperadmin(data.user.email, superadminEmails());
    if (!canRemoveManager(me.id, userId, targetIsSuperadmin)) {
      return { ok: false, error: "A superadmin can't be removed." };
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch {
    return { ok: false, error: "Could not remove that manager. Try again." };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "Manager removed." };
}
