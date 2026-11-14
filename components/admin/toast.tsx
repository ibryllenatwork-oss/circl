"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastItem = { id: number; message: string; tone: "success" | "error" };
const listeners = new Set<(t: ToastItem) => void>();
let counter = 0;

/** Show a short message from any client component (success by default). */
export function toast(message: string, tone: "success" | "error" = "success") {
  const item = { id: ++counter, message, tone };
  listeners.forEach((l) => l(item));
}

/** Mounted once in the admin shell. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const add = (t: ToastItem) => {
      setItems((list) => [...list, t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    // One persistent live region: screen readers announce messages added inside it.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-pop animate-in fade-in-0 slide-in-from-bottom-2"
        >
          {t.tone === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-badge-success" aria-hidden />
          )}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Shows "Saved" once when a page is opened with ?saved=1, then removes the param. */
export function SavedToast({ message = "Changes saved." }: { message?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = params.get("saved") === "1";
  const shown = useRef(false);

  useEffect(() => {
    if (!saved) {
      shown.current = false;
      return;
    }
    if (shown.current) return; // StrictMode runs effects twice in dev
    shown.current = true;
    toast(message);
    const next = new URLSearchParams(params.toString());
    next.delete("saved");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [saved, message, params, pathname, router]);

  return null;
}
