"use client";

import { useState } from "react";
import { maskValue } from "@/lib/format";

/** Shows ••••1234 with a Show/Hide toggle (privacy from onlookers, not access control). */
export function MaskedValue({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span>—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono">{shown ? value : maskValue(value)}</span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-xs text-muted-foreground underline"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </span>
  );
}
