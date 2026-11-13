import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/lib/clients/queries";
import { saveClient } from "../../actions";

async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Edit {client.company_name}</h1>
      <ClientForm
        action={saveClient.bind(null, client.id)}
        client={client}
        cancelHref={`/admin/clients/${client.id}`}
        submitLabel="Save changes"
      />
    </div>
  );
}

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <EditClient params={params} />
    </Suspense>
  );
}
