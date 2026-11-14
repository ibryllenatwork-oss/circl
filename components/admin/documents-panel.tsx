"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ExternalLink, FileText, Trash2, Upload, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fieldClass } from "@/components/ui/input";
import { ExpiryBadge } from "@/components/admin/badges";
import { ConfirmDialog } from "@/components/admin/confirm-delete";
import { toast } from "@/components/admin/toast";
import { deleteDocument, documentDownloadUrl, recordDocument } from "@/lib/documents/actions";
import { uploadFile } from "@/lib/documents/upload-client";
import type { Owner } from "@/lib/documents/rules";
import { LABELS } from "@/lib/employees/labels";
import { expiryState, formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PanelDocument = {
  id: string;
  doc_type: string;
  label: string | null;
  file_name: string | null;
  size_bytes: number | null;
  expires_on: string | null;
  created_at: string;
};

function UploadDialog({ owner, ownerId, docTypes }: { owner: Owner; ownerId: string; docTypes: readonly string[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState(docTypes[0]);
  const [labelText, setLabelText] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const reset = () => {
    setDocType(docTypes[0]);
    setLabelText("");
    setExpires("");
    setFile(null);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Choose a file first.");
    setError(null);
    startTransition(async () => {
      const uploaded = await uploadFile(owner, ownerId, file, "document");
      if (!uploaded.ok) return setError(uploaded.error);
      const saved = await recordDocument(owner, ownerId, {
        path: uploaded.path,
        doc_type: docType,
        label: labelText,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        expires_on: expires || undefined,
      });
      if (!saved.ok) return setError(saved.error);
      toast(`${LABELS[docType] ?? "Document"} uploaded.`);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), o || reset())}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Upload /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>PDF, JPG, PNG or WEBP, up to 10 MB. Files are private to managers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Type
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className={cn(fieldClass, "h-9 font-normal")}>
                {docTypes.map((t) => (
                  <option key={t} value={t}>
                    {LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Expires on{" "}
              <span className="sr-only">{docType === "nbi_clearance" ? "(recommended)" : "(optional)"}</span>
              <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={cn(fieldClass, "h-9 font-normal")} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
              Label <span className="sr-only">(optional)</span>
              <input
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder={docType === "government_id" ? "e.g. UMID" : "Optional, e.g. 2026"}
                className={cn(fieldClass, "h-9 font-normal")}
              />
            </label>
          </div>
          <label
            onDragOver={(e) => (e.preventDefault(), setDragging(true))}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 px-4 py-7 text-center transition-colors hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              dragging && "border-primary bg-accent",
            )}
          >
            <UploadCloud className="h-6 w-6 text-primary" aria-hidden />
            <span className="text-sm font-medium">{file ? file.name : "Drop a file here, or click to choose"}</span>
            {file && <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {docType === "nbi_clearance" && !expires && (
            <p className="text-xs text-muted-foreground">Tip: add the expiry date so the record can warn you before it lapses.</p>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !file}>
              {busy ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsPanel({
  owner,
  ownerId,
  documents,
  docTypes,
  className,
}: {
  owner: Owner;
  ownerId: string;
  documents: PanelDocument[];
  docTypes: readonly string[];
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const open = (id: string) => {
    // Open the tab during the click (Safari blocks window.open after an await), then point it at the file.
    const tab = window.open("about:blank", "_blank");
    startTransition(async () => {
      const r = await documentDownloadUrl(owner, id);
      if (r.ok) {
        if (tab) {
          tab.opener = null;
          tab.location.href = r.url;
        } else window.location.href = r.url;
      } else {
        tab?.close();
        setError(r.error);
      }
    });
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Documents</h2>
        <UploadDialog owner={owner} ownerId={ownerId} docTypes={docTypes} />
      </div>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No documents yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-badge-brand-bg text-badge-brand">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {LABELS[d.doc_type] ?? d.doc_type}
                  {d.label && <span className="font-normal text-muted-foreground"> · {d.label}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.file_name}
                  {formatBytes(d.size_bytes) && ` · ${formatBytes(d.size_bytes)}`} · added {formatDate(d.created_at)}
                </p>
              </div>
              {d.expires_on && <ExpiryBadge state={expiryState(d.expires_on)} date={formatDate(d.expires_on)} />}
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => open(d.id)} disabled={busy} aria-label={`Open ${d.file_name ?? "document"}`}>
                  <ExternalLink />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${d.file_name ?? "document"}`}>
                      <Trash2 />
                    </Button>
                  }
                  title="Delete this document?"
                  description={`${d.file_name ?? "This file"} will be permanently removed. This can't be undone.`}
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const r = await deleteDocument(owner, d.id);
                    if (r.ok) {
                      toast("Document deleted.");
                      router.refresh();
                    }
                    return r;
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
