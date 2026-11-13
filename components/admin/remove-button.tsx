"use client";

import { useState, useTransition } from "react";
import { removeManager } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";

export function RemoveButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!confirm(`Remove ${email}? They will lose access immediately.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeManager(userId);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
        {pending ? "Removing..." : "Remove"}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
