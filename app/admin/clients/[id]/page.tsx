import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DetailSection, Item } from "@/components/admin/detail";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { DocumentsPanel } from "@/components/admin/documents-panel";
import { AssignedVAs } from "@/components/clients/assign-va";
import { DeleteClient } from "@/components/clients/delete-client";
import { getClient } from "@/lib/clients/queries";
import { listAssignableEmployees } from "@/lib/employees/queries";
import { CLIENT_DOC_TYPES } from "@/lib/clients/labels";
import { label } from "@/lib/employees/labels";
import { expiryState, formatDate, formatMoney } from "@/lib/format";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";

async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, options] = await Promise.all([getClient(id), listAssignableEmployees()]);
  if (!c) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {c.company_name}
            {c.created_by === DEV_MANAGER.email && <DevBadge />}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={c.status} />
            {c.industry && <span>{c.industry}</span>}
            {c.contract_end && (
              <span>Contract <ExpiryBadge state={expiryState(c.contract_end)} date={formatDate(c.contract_end)} /></span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm"><Link href={`/admin/clients/${c.id}/edit`}>Edit</Link></Button>
          <DeleteClient id={c.id} companyName={c.company_name} />
        </div>
      </div>

      <DetailSection title="Company">
        <Item label="Website">
          {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="underline">{c.website.replace(/^https?:\/\//, "")}</a>}
        </Item>
        <Item label="Country">{c.country}</Item>
        <Item label="Timezone">{c.timezone}</Item>
        <Item label="Client since">{c.start_date ? formatDate(c.start_date) : null}</Item>
      </DetailSection>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Contacts</h2>
        <ul className="divide-y rounded-md border text-sm">
          {c.contacts.map((p) => (
            <li key={p.id} className="flex flex-wrap gap-x-4 gap-y-1 p-3">
              <span className="font-medium">
                {p.name}
                {p.is_primary && <span className="ml-2 rounded border px-1.5 text-[10px] uppercase">Primary</span>}
              </span>
              {p.role && <span className="text-muted-foreground">{p.role}</span>}
              {p.email && <a href={`mailto:${p.email}`} className="underline">{p.email}</a>}
              {p.phone && <span>{p.phone}</span>}
            </li>
          ))}
        </ul>
      </section>

      <AssignedVAs clientId={c.id} vas={c.vas} options={options} />

      <DetailSection title="Billing">
        <Item label="Agreed rate">
          {c.rate != null ? `${formatMoney(c.rate, c.currency)}${c.rate_basis ? ` / ${c.rate_basis === "hourly" ? "hour" : "month"}` : ""}` : null}
        </Item>
        <Item label="Currency">{c.currency}</Item>
        <Item label="Billing cycle">{c.billing_cycle ? label(c.billing_cycle) : null}</Item>
        <Item label="Payment method">{c.payment_method}</Item>
        <Item label="Billing email">{c.billing_email}</Item>
        <Item label="Billing address" wide>{c.billing_address}</Item>
      </DetailSection>

      <DetailSection title="Engagement">
        <Item label="Services" wide>{c.services.join(", ")}</Item>
        <Item label="Hours per week">{c.hours_per_week != null ? String(c.hours_per_week) : null}</Item>
        <Item label="Contract start">{c.contract_start ? formatDate(c.contract_start) : null}</Item>
        <Item label="Contract end">{c.contract_end ? formatDate(c.contract_end) : null}</Item>
      </DetailSection>

      <DocumentsPanel owner="clients" ownerId={c.id} documents={c.documents} docTypes={CLIENT_DOC_TYPES} />

      <DetailSection title="Notes">
        <Item label="Notes" wide>{c.notes}</Item>
      </DetailSection>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(c.updated_at)} by {c.updated_by ?? "—"} · Created {formatDate(c.created_at)} by {c.created_by ?? "—"}
      </p>
    </div>
  );
}

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <ClientDetail params={params} />
    </Suspense>
  );
}
