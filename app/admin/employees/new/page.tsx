import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/admin/page-header";
import { createEmployee } from "../actions";

export const metadata = { title: "Add employee" };

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader
        eyebrow="Employees"
        title="Add employee"
        description="Only fields marked * are required. You can add a photo and documents after saving."
      />
      <EmployeeForm action={createEmployee} employee={null} cancelHref="/admin/employees" submitLabel="Save employee" />
    </>
  );
}
