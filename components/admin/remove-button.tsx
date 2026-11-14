"use client";

import { UserMinus } from "lucide-react";
import { removeManager } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-delete";
import { toast } from "./toast";

export function RemoveButton({ userId, email }: { userId: string; email: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Remove ${email}`}>
          <UserMinus />
        </Button>
      }
      title={`Remove ${email}?`}
      description="They will lose access to the circl. admin immediately. You can invite them again later."
      confirmLabel="Remove manager"
      onConfirm={async () => {
        const r = await removeManager(userId);
        if (r.ok) toast("Manager removed.");
        return r.ok ? r : { ok: false, error: r.error };
      }}
    />
  );
}
