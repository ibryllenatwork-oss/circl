"use client";

import { useActionState } from "react";
import { inviteManager } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteManager, null);

  return (
    <form action={action} className="flex max-w-md flex-col gap-2">
      <Label htmlFor="invite-email">Invite a manager by email</Label>
      <div className="flex gap-2">
        <Input id="invite-email" name="email" type="email" placeholder="name@company.com" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send invite"}
        </Button>
      </div>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-green-600" : "text-sm text-red-500"}>
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
