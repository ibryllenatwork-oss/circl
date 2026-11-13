"use client";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteClient } from "@/app/admin/clients/actions";

export function DeleteClient({ id, companyName }: { id: string; companyName: string }) {
  return (
    <ConfirmDelete
      confirmWord={companyName}
      what={companyName}
      keepHint="To keep the record, set the status to Ended instead."
      onDelete={(typed) => deleteClient(id, typed)}
    />
  );
}
