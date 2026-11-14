import Link from "next/link";
import { Suspense } from "react";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { TableSkeleton } from "@/components/admin/skeletons";
import { asList } from "@/components/admin/list-controls";
import { ServicesTabs } from "@/components/services/services-tabs";
import { AddServiceButton, ServiceActions } from "@/components/services/service-actions";
import { RatesDialog } from "@/components/services/rates-dialog";
import { RateCell } from "@/components/services/money";
import { getCatalog, parentOptions, type CatalogItem, type CatalogService } from "@/lib/services/queries";
import { TIER_LABELS, TIERS } from "@/lib/services/pricing";
import type { ParentOption } from "@/components/services/service-dialog";
import { cn } from "@/lib/utils";

export const metadata = { title: "Services & Rates" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const actionItem = (s: CatalogItem) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  parent_id: s.parent_id,
  active: s.active,
  childCount: s.childCount,
  usedInPackages: s.usedInPackages,
  hasRates: Object.keys(s.rates).length > 0,
});

function StatusBadges({ item }: { item: CatalogItem }) {
  return (
    <>
      {!item.active && <Badge variant="neutral">Archived</Badge>}
      {item.active && item.parentActive === false && <Badge variant="neutral">Parent archived</Badge>}
      {item.usedInPackages > 0 && (
        <Badge variant="brand">
          In {item.usedInPackages} package line{item.usedInPackages === 1 ? "" : "s"}
        </Badge>
      )}
    </>
  );
}

/** A priceable row: name + tier cells (stacked on mobile) + rate dialog + menu. */
function RateRow({ item, parents, isFirst, isLast, showMenu }: { item: CatalogItem; parents: ParentOption[]; isFirst: boolean; isLast: boolean; showMenu: boolean }) {
  return (
    <div className={cn("grid gap-4 border-t border-border/60 px-5 py-4 first:border-t-0 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] lg:items-center", !item.effectiveActive && "opacity-60")}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {item.name} <StatusBadges item={item} />
        </p>
        {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 lg:contents">
        {TIERS.map((t) => (
          <div key={t}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">{TIER_LABELS[t]}</p>
            <RateCell rate={item.rates[t]} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 lg:justify-end">
        <RatesDialog serviceId={item.id} name={item.name} rates={item.rates} />
        {showMenu && <ServiceActions item={actionItem(item)} parents={parents} isFirst={isFirst} isLast={isLast} />}
      </div>
    </div>
  );
}

function ServiceCard({ service, parents, isFirst, isLast }: { service: CatalogService; parents: ParentOption[]; isFirst: boolean; isLast: boolean }) {
  const priceable = service.children.length === 0;
  return (
    <Card className={cn("overflow-hidden", !service.active && "border-dashed")}>
      <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/40 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-tight">
            {service.name} <StatusBadges item={service} />
          </h2>
          {service.description && <p className="mt-0.5 text-sm text-muted-foreground">{service.description}</p>}
          {!priceable && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {service.children.length} subservice{service.children.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <ServiceActions item={actionItem(service)} parents={parents} isFirst={isFirst} isLast={isLast} />
      </div>

      <div className="hidden grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] gap-4 px-6 pt-3 text-xs font-medium text-muted-foreground lg:grid">
        <span>{priceable ? "Rates" : "Subservice"}</span>
        {TIERS.map((t) => (
          <span key={t}>{TIER_LABELS[t]}</span>
        ))}
        <span className="w-[132px]" />
      </div>

      {priceable ? (
        <RateRow item={service} parents={parents} isFirst isLast showMenu={false} />
      ) : (
        service.children.map((c, i) => (
          <RateRow key={c.id} item={c} parents={parents} isFirst={i === 0} isLast={i === service.children.length - 1} showMenu />
        ))
      )}
    </Card>
  );
}

async function Catalog({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const includeArchived = asList(params.archived)[0] === "1";
  const [catalog, parents] = await Promise.all([getCatalog({ includeArchived }), parentOptions()]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Services & Rates"
        description="What circl. offers, what clients pay and what VAs earn, per hour in USD."
        actions={<AddServiceButton parents={parents} />}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ServicesTabs active="catalog" />
        <Link
          href={includeArchived ? "/admin/services" : "/admin/services?archived=1"}
          aria-pressed={includeArchived}
          className={cn(
            "mb-6 inline-flex h-8 items-center rounded-full border border-dashed px-3 text-[13px] transition-colors hover:border-primary/40",
            includeArchived ? "border-primary/30 bg-accent font-medium text-primary" : "text-muted-foreground",
          )}
        >
          Show archived
        </Link>
      </div>

      {catalog.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title={includeArchived ? "No services yet" : "No active services"}
            description="Add a service like “Administrative support”, then add subservices and set their rates."
            action={<AddServiceButton parents={parents} />}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {catalog.map((s, i) => (
            <ServiceCard key={s.id} service={s} parents={parents} isFirst={i === 0} isLast={i === catalog.length - 1} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Catalog searchParams={searchParams} />
    </Suspense>
  );
}
