import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/admin/page-header";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { getEmployee } from "@/lib/employees/queries";
import { fullName } from "@/lib/format";
import { updateEmployee } from "../../actions";

async function EditEmployee({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();
  return (
    <>
      <PageHeader eyebrow={employee.employee_no} title={`Edit ${fullName(employee)}`} />
      <EmployeeForm
        action={updateEmployee.bind(null, employee.id)}
        employee={employee}
        cancelHref={`/admin/employees/${employee.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EditEmployee params={params} />
    </Suspense>
  );
}
