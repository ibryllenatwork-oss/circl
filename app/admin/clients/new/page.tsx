import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/admin/page-header";
import { saveClient } from "../actions";

export const metadata = { title: "Add client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Add client"
        description="Only fields marked * are required. You can assign VAs and add documents after saving."
      />
      <ClientForm action={saveClient.bind(null, null)} client={null} cancelHref="/admin/clients" submitLabel="Save client" />
    </>
  );
}
