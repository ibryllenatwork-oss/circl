import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { PackageBuilder } from "@/components/services/package-builder";
import { pricingData } from "@/lib/services/queries";
import { savePackage } from "../../actions";

export const metadata = { title: "Build a package" };

async function NewPackage() {
  const { options, rates } = await pricingData();
  return <PackageBuilder action={savePackage.bind(null, null)} pkg={null} options={options} rates={rates} submitLabel="Save package" />;
}

export default function NewPackagePage() {
  return (
    <>
      <PageHeader eyebrow="Packages" title="Build a package" description="Add services at a tier and hours, then set what the client pays per month." />
      <Suspense fallback={<DetailSkeleton />}>
        <NewPackage />
      </Suspense>
    </>
  );
}
