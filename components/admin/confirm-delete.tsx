"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/validation/action";

/** Permanent delete: the user must type `confirmWord` before the button enables. */
export function ConfirmDelete({
  confirmWord,
  what,
  keepHint,
  onDelete,
}: {
  confirmWord: string;
  what: string;
  keepHint: string;
  onDelete: (typed: string) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="text-red-600" onClick={() => setOpen(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Delete ${what}`} className="flex max-w-md flex-col gap-2 rounded-md border border-red-300 p-3 text-sm">
      <p>
        <strong>Permanently delete {what}?</strong> This removes the record and all its documents and
        can&apos;t be undone. {keepHint}
      </p>
      <label htmlFor="confirm-delete" className="text-xs">
        Type <span className="font-mono font-semibold">{confirmWord}</span> to confirm
      </label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="h-9 rounded-md border px-3"
        autoComplete="off"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={pending || typed.trim().toUpperCase() !== confirmWord.toUpperCase()}
          onClick={() =>
            startTransition(async () => {
              const result = await onDelete(typed);
              if (result && !result.ok) setError(result.error ?? "Could not delete.");
            })
          }
        >
          {pending ? "Deleting..." : "Delete permanently"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
