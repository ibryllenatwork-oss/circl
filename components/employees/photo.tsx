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
        aria-label={url ? `Change photo of ${name}` : `Add a photo of ${name}`}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-brand-magenta text-xl font-semibold text-primary-foreground ring-4 ring-accent transition-opacity disabled:opacity-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {busy ? "Uploading…" : url ? "Change" : "Add photo"}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = ""; // allow picking the same file again after an error
        }}
      />
      {error && <span role="alert" className="max-w-40 text-center text-xs font-medium text-destructive">{error}</span>}
    </div>
  );
}
