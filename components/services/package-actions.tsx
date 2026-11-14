"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Copy, Eye, MoreHorizontal, Trash2 } from "lucide-react";
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
import { deletePackage, duplicatePackage, setPackageActive } from "@/app/admin/services/actions";

export function PackageActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [deleting, setDeleting] = useState(false);
  const [busy, startTransition] = useTransition();

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
          aria-label={`Actions for ${name}`}
          disabled={busy}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/services/packages/${id}`}>
              <Eye className="mr-2 h-4 w-4" /> Open
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => duplicatePackage(id))}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => setPackageActive(id, !active))}>
            {active ? <Archive className="mr-2 h-4 w-4" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
            {active ? "Archive" : "Restore"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleting(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>The package and its lines will be permanently removed. To keep it for reference, archive it instead.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleting(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await deletePackage(id);
                  if (!r.ok) toast(r.error, "error");
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
