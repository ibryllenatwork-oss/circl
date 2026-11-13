"use client";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteEmployee } from "@/app/admin/employees/actions";

export function DeleteEmployee({ id, employeeNo }: { id: string; employeeNo: string }) {
  return (
    <ConfirmDelete
      confirmWord={employeeNo}
      what={`201 file ${employeeNo}`}
      keepHint="To keep the file, set the status to Resigned or Terminated instead."
      onDelete={(typed) => deleteEmployee(id, typed)}
    />
  );
}
