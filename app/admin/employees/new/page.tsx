import { EmployeeForm } from "@/components/employees/employee-form";
import { createEmployee } from "../actions";

export default function NewEmployeePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Add employee</h1>
        <p className="text-sm text-muted-foreground">
          Only fields marked * are required. You can add a photo and documents after saving.
        </p>
      </div>
      <EmployeeForm action={createEmployee} employee={null} cancelHref="/admin/employees" submitLabel="Save employee" />
    </div>
  );
}
