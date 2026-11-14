import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/admin/page-header";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { getClient } from "@/lib/clients/queries";
import { saveClient } from "../../actions";

async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return (
    <>
      <PageHeader eyebrow="Clients" title={`Edit ${client.company_name}`} />
      <ClientForm
        action={saveClient.bind(null, client.id)}
        client={client}
        cancelHref={`/admin/clients/${client.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EditClient params={params} />
    </Suspense>
  );
}
