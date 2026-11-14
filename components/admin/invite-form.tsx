"use client";

import { useActionState, useEffect } from "react";
import { Send } from "lucide-react";
import { inviteManager } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldClass } from "@/components/ui/input";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteManager, null);

  useEffect(() => {
    if (state?.ok) toast(state.message);
  }, [state]);

  return (
    <Card className="p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="invite-email" className="text-[15px] font-semibold tracking-tight">
            Invite a manager
          </label>
          <p className="text-sm text-muted-foreground">They&apos;ll get an email to set their password.</p>
          <input
            id="invite-email"
            name="email"
            type="email"
            placeholder="name@company.com"
            required
            aria-invalid={state ? !state.ok : undefined}
            aria-describedby={state && !state.ok ? "invite-error" : undefined}
            className={cn(fieldClass, "mt-1.5 h-9")}
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Send /> {pending ? "Sending…" : "Send invite"}
        </Button>
      </form>
      {state && !state.ok && (
        <p id="invite-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
    </Card>
  );
}
