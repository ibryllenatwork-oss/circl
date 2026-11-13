import { ClientForm } from "@/components/clients/client-form";
import { saveClient } from "../actions";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Add client</h1>
        <p className="text-sm text-muted-foreground">
          Only fields marked * are required. You can assign VAs and add documents after saving.
        </p>
      </div>
      <ClientForm action={saveClient.bind(null, null)} client={null} cancelHref="/admin/clients" submitLabel="Save client" />
    </div>
  );
}
