"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setEmployeePhoto } from "@/lib/documents/actions";
import { uploadFile } from "@/lib/documents/upload-client";

export function EmployeePhoto({ employeeId, url, name }: { employeeId: string; url: string | null; name: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onPick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const uploaded = await uploadFile("employees", employeeId, file, "photo");
      if (!uploaded.ok) return setError(uploaded.error);
      const saved = await setEmployeePhoto(employeeId, uploaded.path);
      if (!saved.ok) return setError(saved.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        title={url ? "Change photo" : "Add photo"}
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-semibold text-muted-foreground"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials}
      </button>
      <span className="text-[11px] text-muted-foreground">{busy ? "Uploading..." : url ? "Change photo" : "Add photo"}</span>
      <input
        ref={input}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {error && <span className="max-w-40 text-center text-xs text-red-500">{error}</span>}
    </div>
  );
}
