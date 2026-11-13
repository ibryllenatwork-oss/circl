"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ExpiryBadge } from "@/components/admin/badges";
import { deleteDocument, documentDownloadUrl, recordDocument } from "@/lib/documents/actions";
import { uploadFile } from "@/lib/documents/upload-client";
import type { Owner } from "@/lib/documents/rules";
import { LABELS } from "@/lib/employees/labels";
import { expiryState, formatBytes, formatDate } from "@/lib/format";

export type PanelDocument = {
  id: string;
  doc_type: string;
  label: string | null;
  file_name: string | null;
  size_bytes: number | null;
  expires_on: string | null;
  created_at: string;
};

export function DocumentsPanel({
  owner,
  ownerId,
  documents,
  docTypes,
}: {
  owner: Owner;
  ownerId: string;
  documents: PanelDocument[];
  docTypes: readonly string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(docTypes[0]);
  const [labelText, setLabelText] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const upload = () => {
    const file = fileRef.current?.files?.[0];
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
      if (fileRef.current) fileRef.current.value = "";
      setLabelText("");
      setExpires("");
      router.refresh();
    });
  };

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

  const remove = (doc: PanelDocument) => {
    if (!confirm(`Delete ${doc.file_name ?? "this document"}? This can't be undone.`)) return;
    startTransition(async () => {
      const r = await deleteDocument(owner, doc.id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  };

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">Documents</h2>

      {documents.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <ul className="mb-4 divide-y rounded-md border text-sm">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {LABELS[d.doc_type] ?? d.doc_type}
                  {d.label && <span className="font-normal text-muted-foreground"> · {d.label}</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.file_name} {formatBytes(d.size_bytes) && `· ${formatBytes(d.size_bytes)}`} · added{" "}
                  {formatDate(d.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {d.expires_on && <ExpiryBadge state={expiryState(d.expires_on)} date={formatDate(d.expires_on)} />}
                <Button size="sm" variant="outline" onClick={() => open(d.id)} disabled={busy}>
                  Open
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => remove(d)} disabled={busy}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Type
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-9 rounded-md border bg-transparent px-2 text-sm font-normal"
          >
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Label (optional)
          <input
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            placeholder={docType === "government_id" ? "e.g. UMID" : "e.g. 2026"}
            className="h-9 rounded-md border bg-transparent px-2 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Expires on {docType === "nbi_clearance" ? "(recommended)" : "(optional)"}
          <input
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="h-9 rounded-md border bg-transparent px-2 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          File (PDF, JPG, PNG, WEBP · max 10 MB)
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="text-sm font-normal" />
        </label>
        <Button onClick={upload} disabled={busy}>
          {busy ? "Working..." : "Upload"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}
