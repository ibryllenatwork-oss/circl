"use client";

import { useState, useTransition } from "react";
import { ArchiveRestore, Archive, ArrowDown, ArrowUp, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/admin/toast";
import { deleteService, moveService, setServiceActive } from "@/app/admin/services/actions";
import { ServiceDialog, type ParentOption } from "./service-dialog";

type Item = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  active: boolean;
  childCount: number;
  usedInPackages: number;
  hasRates: boolean;
};

/** The ⋯ menu for a service or subservice, plus the dialogs it opens. */
export function ServiceActions({
  item,
  parents,
  isFirst,
  isLast,
}: {
  item: Item;
  parents: ParentOption[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const isTop = !item.parent_id;
  const canAddChild = isTop && !item.hasRates && item.usedInPackages === 0;
  const deleteBlocked =
    item.childCount > 0 ? "Has subservices" : item.usedInPackages > 0 ? `Used in ${item.usedInPackages} package line${item.usedInPackages === 1 ? "" : "s"}` : null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast(r.error ?? "Something went wrong.", "error");
      else if (r.message) toast(r.message);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${item.name}`}
          disabled={busy}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          {isTop && (
            <DropdownMenuItem disabled={!canAddChild} onSelect={() => setAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="flex flex-col">
                Add subservice
                {!canAddChild && (
                  <span className="text-[11px] text-muted-foreground">Remove its rates / package lines first</span>
                )}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isFirst} onSelect={() => run(() => moveService(item.id, "up"))}>
            <ArrowUp className="mr-2 h-4 w-4" /> Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isLast} onSelect={() => run(() => moveService(item.id, "down"))}>
            <ArrowDown className="mr-2 h-4 w-4" /> Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => run(() => setServiceActive(item.id, !item.active))}>
            {item.active ? <Archive className="mr-2 h-4 w-4" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
            {item.active ? "Archive" : "Restore"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={Boolean(deleteBlocked)}
            onSelect={() => setDeleting(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="flex flex-col">
              Delete
              {deleteBlocked && <span className="text-[11px] text-muted-foreground">{deleteBlocked}, so archive instead</span>}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ServiceDialog open={editing} onOpenChange={setEditing} service={item} parents={parents} />
      {isTop && <ServiceDialog open={adding} onOpenChange={setAdding} defaultParentId={item.id} parents={parents} />}

      <Dialog open={deleting} onOpenChange={(o) => (setDeleting(o), setError(null))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {item.name}?</DialogTitle>
            <DialogDescription>
              {item.hasRates ? "Its rates will be deleted too. " : ""}This can&apos;t be undone. To keep it out of sight instead, archive it.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleting(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteService(item.id);
                  if (!r.ok) setError(r.error);
                  else {
                    toast(r.message ?? "Deleted.");
                    setDeleting(false);
                  }
                })
              }
            >
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AddServiceButton({ parents }: { parents: ParentOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add service
      </Button>
      <ServiceDialog open={open} onOpenChange={setOpen} parents={parents} />
    </>
  );
}
