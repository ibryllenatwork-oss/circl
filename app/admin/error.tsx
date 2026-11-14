"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-badge-error-bg text-badge-error">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page couldn&apos;t load. It may be a connection problem. Try again in a moment.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </Card>
  );
}
