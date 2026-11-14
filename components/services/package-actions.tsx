"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, CheckCircle2, Copy, Eye, FilePen, MoreHorizontal, Trash2 } from "lucide-react";
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
import { deletePackage, duplicatePackage, setPackageStatus } from "@/app/admin/services/actions";
import type { PackageStatus } from "@/lib/services/schema";

/**
 * Row/header menu for a package. On the package's own page (`detail`), status is
 * changed in the form instead (so unsaved edits aren't lost), and deleting goes
 * back to the list.
 */
export function PackageActions({
  id,
  name,
  status,
  detail = false,
}: {
  id: string;
  name: string;
  status: PackageStatus;
  detail?: boolean;
}) {
  const router = useRouter();
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
          {!detail && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/services/packages/${id}`}>
                <Eye className="mr-2 h-4 w-4" /> Open
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => run(() => duplicatePackage(id))}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate as draft
          </DropdownMenuItem>
          {!detail && (
            <>
              <DropdownMenuSeparator />
              {status !== "active" && (
                <DropdownMenuItem onSelect={() => run(() => setPackageStatus(id, "active"))}>
                  {status === "archived" ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {status === "archived" ? "Restore as active" : "Mark active"}
                </DropdownMenuItem>
              )}
              {status !== "draft" && (
                <DropdownMenuItem onSelect={() => run(() => setPackageStatus(id, "draft"))}>
                  <FilePen className="mr-2 h-4 w-4" /> Move to drafts
                </DropdownMenuItem>
              )}
              {status !== "archived" && (
                <DropdownMenuItem onSelect={() => run(() => setPackageStatus(id, "archived"))}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              )}
            </>
          )}
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
                  if (!r.ok) {
                    toast(r.error, "error");
                    return;
                  }
                  toast(r.message ?? "Deleted.");
                  setDeleting(false);
                  if (detail) router.push("/admin/services/packages");
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
