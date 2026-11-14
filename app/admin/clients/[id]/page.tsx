import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Mail, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailSection, Item } from "@/components/admin/detail";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { DocumentsPanel } from "@/components/admin/documents-panel";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { Initials } from "@/components/admin/preview-card";
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
      <Link href="/admin/clients" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Clients
      </Link>

      <Card className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Initials name={c.company_name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {c.company_name}
              {c.created_by === DEV_MANAGER.email && <DevBadge />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[c.industry, c.country].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              {c.contract_end && <ExpiryBadge state={expiryState(c.contract_end)} date={`Contract ${formatDate(c.contract_end)}`} />}
              <Badge variant="neutral">{c.currency}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/clients/${c.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
          <DeleteClient id={c.id} companyName={c.company_name} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6">
          <h2 className="mb-4 text-[15px] font-semibold tracking-tight">Contacts</h2>
          <ul className="flex flex-col divide-y divide-border/70">
            {c.contacts.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Initials name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {p.name}
                    {p.is_primary && (
                      <Badge variant="brand" className="ml-2 px-2 py-0 text-[10px] uppercase tracking-wide">
                        Primary
                      </Badge>
                    )}
                  </p>
                  {p.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="inline-flex min-w-0 items-center gap-1 break-all text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {p.email}
                      </a>
                    )}
                    {p.phone && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {p.phone}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <AssignedVAs clientId={c.id} vas={c.vas} options={options} />

        <DetailSection title="Company">
          <Item label="Website">
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {c.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </Item>
          <Item label="Timezone">{c.timezone}</Item>
          <Item label="Client since">{c.start_date ? formatDate(c.start_date) : null}</Item>
          <Item label="Country">{c.country}</Item>
        </DetailSection>

        <DetailSection title="Billing">
          <Item label="Agreed rate">
            {c.rate != null ? `${formatMoney(c.rate, c.currency)}${c.rate_basis ? ` / ${c.rate_basis === "hourly" ? "hour" : "month"}` : ""}` : null}
          </Item>
          <Item label="Billing cycle">{c.billing_cycle ? label(c.billing_cycle) : null}</Item>
          <Item label="Payment method">{c.payment_method}</Item>
          <Item label="Billing email">{c.billing_email}</Item>
          <Item label="Billing address" wide>
            {c.billing_address}
          </Item>
        </DetailSection>

        <DetailSection title="Engagement">
          <Item label="Services" wide>
            {c.services.length > 0 && (
              <span className="flex flex-wrap gap-1.5">
                {c.services.map((s) => (
                  <Badge key={s} variant="brand">
                    {s}
                  </Badge>
                ))}
              </span>
            )}
          </Item>
          <Item label="Hours per week">{c.hours_per_week != null ? String(c.hours_per_week) : null}</Item>
          <Item label="Contract start">{c.contract_start ? formatDate(c.contract_start) : null}</Item>
          <Item label="Contract end">{c.contract_end ? formatDate(c.contract_end) : null}</Item>
        </DetailSection>

        <DetailSection title="Notes">
          <Item label="Notes" wide>
            {c.notes}
          </Item>
        </DetailSection>

        <DocumentsPanel owner="clients" ownerId={c.id} documents={c.documents} docTypes={CLIENT_DOC_TYPES} className="xl:col-span-2" />
      </div>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(c.updated_at)} by {c.updated_by ?? "—"} · Created {formatDate(c.created_at)} by {c.created_by ?? "—"}
      </p>
    </div>
  );
}

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ClientDetail params={params} />
    </Suspense>
  );
}
