import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmployeeForm } from "@/components/employees/employee-form";
import { getEmployee } from "@/lib/employees/queries";
import { fullName } from "@/lib/format";
import { updateEmployee } from "../../actions";

async function EditEmployee({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Edit {fullName(employee)}</h1>
        <p className="font-mono text-xs text-muted-foreground">{employee.employee_no}</p>
      </div>
      <EmployeeForm
        action={updateEmployee.bind(null, employee.id)}
        employee={employee}
        cancelHref={`/admin/employees/${employee.id}`}
        submitLabel="Save changes"
      />
    </div>
  );
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <EditEmployee params={params} />
    </Suspense>
  );
}
