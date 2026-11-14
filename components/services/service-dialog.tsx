"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClass } from "@/components/ui/input";
import { FormAlert } from "@/components/admin/form-fields";
import { toast } from "@/components/admin/toast";
import { saveService } from "@/app/admin/services/actions";
import { cn } from "@/lib/utils";

export type ParentOption = { id: string; name: string; blocked: string | null };

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  defaultParentId = null,
  parents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: { id: string; name: string; description: string | null; parent_id: string | null; childCount: number };
  defaultParentId?: string | null;
  parents: ParentOption[];
}) {
  const [state, action, pending] = useActionState(saveService.bind(null, service?.id ?? null), null);

  useEffect(() => {
    if (state?.ok) {
      toast(state.message ?? "Saved.");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const v = state && !state.ok ? state.values ?? {} : {};
  const err = state && !state.ok ? state.fieldErrors ?? {} : {};
  const parentValue = v.parent_id ?? service?.parent_id ?? defaultParentId ?? "";
  // A service with subservices must stay top-level.
  const canHaveParent = !service || service.childCount === 0;
  const title = service ? `Edit ${service.name}` : defaultParentId ? "Add subservice" : "Add service";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Services can have one level of subservices. Rates go on the items clients actually buy.</DialogDescription>
        </DialogHeader>
        <form key={JSON.stringify(state)} action={action} className="flex flex-col gap-4" noValidate>
          {state && !state.ok && state.error && <FormAlert message={state.error} />}
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Name <span className="sr-only">(required)</span>
            <input
              name="name"
              defaultValue={v.name ?? service?.name ?? ""}
              aria-invalid={Boolean(err.name)}
              className={cn(fieldClass, "h-9 font-normal")}
              autoFocus
            />
            {err.name && <span className="text-xs font-medium text-destructive">{err.name}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={v.description ?? service?.description ?? ""}
              className={cn(fieldClass, "py-2 font-normal")}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Belongs under
            <select
              name="parent_id"
              defaultValue={parentValue}
              disabled={!canHaveParent}
              aria-invalid={Boolean(err.parent_id)}
              className={cn(fieldClass, "h-9 font-normal")}
            >
              <option value="">Nothing (top-level service)</option>
              {parents
                .filter((p) => p.id !== service?.id)
                .map((p) => (
                  <option key={p.id} value={p.id} disabled={Boolean(p.blocked) && p.id !== service?.parent_id}>
                    {p.name}
                    {p.blocked ? ` (${p.blocked})` : ""}
                  </option>
                ))}
            </select>
            {!canHaveParent && (
              <span className="text-xs font-normal text-muted-foreground">This service has subservices, so it stays top-level.</span>
            )}
            {!canHaveParent && <input type="hidden" name="parent_id" value="" />}
            {err.parent_id && <span className="text-xs font-medium text-destructive">{err.parent_id}</span>}
          </label>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
