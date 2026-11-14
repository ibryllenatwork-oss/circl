import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { PackageBuilder } from "@/components/services/package-builder";
import { PackageActions } from "@/components/services/package-actions";
import { getPackage, pricingData } from "@/lib/services/queries";
import { formatDate } from "@/lib/format";
import { savePackage } from "../../actions";

async function EditPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pkg, { options, rates }] = await Promise.all([getPackage(id), pricingData()]);
  if (!pkg) notFound();
  return (
    <>
      <Link href="/admin/services/packages" className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Packages
      </Link>
      <PageHeader
        eyebrow="Package"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {pkg.name}
            {pkg.status === "draft" && <Badge variant="processing">Draft</Badge>}
            {pkg.status === "archived" && <Badge variant="neutral">Archived</Badge>}
          </span>
        }
        description={`Last updated ${formatDate(pkg.updated_at)}${pkg.updated_by ? ` by ${pkg.updated_by}` : ""}`}
        actions={<PackageActions id={pkg.id} name={pkg.name} status={pkg.status} detail />}
      />
      <PackageBuilder key={pkg.updated_at} action={savePackage.bind(null, pkg.id)} pkg={pkg} options={options} rates={rates} submitLabel="Save changes" />
    </>
  );
}

export default function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EditPackage params={params} />
    </Suspense>
  );
}
