import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailSection, Item } from "@/components/admin/detail";
import { MaskedValue } from "@/components/admin/masked-value";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { Badge } from "@/components/ui/badge";
import { DocumentsPanel } from "@/components/admin/documents-panel";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { EmployeePhoto } from "@/components/employees/photo";
import { DeleteEmployee } from "@/components/employees/delete-employee";
import { getEmployee } from "@/lib/employees/queries";
import { EMPLOYEE_DOC_TYPES, label } from "@/lib/employees/labels";
import { expiryState, formatDate, formatMoney, fullName, latestExpiry } from "@/lib/format";
import { DEV_MANAGER } from "@/lib/auth/dev-bypass";
import { photoUrl } from "@/lib/documents/queries";

async function EmployeeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getEmployee(id);
  if (!e) notFound();

  const nbi = latestExpiry(e.documents, "nbi_clearance");
  const nbiState = expiryState(nbi);
  const photo = e.photo_path ? await photoUrl(e.photo_path) : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/employees" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Employees
      </Link>

      <Card className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <EmployeePhoto employeeId={e.id} url={photo} name={fullName(e)} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {fullName(e)}
              {e.nickname && <span className="text-base font-normal text-muted-foreground"> ({e.nickname})</span>}
              {e.created_by === DEV_MANAGER.email && <DevBadge />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {e.position} · <span className="font-mono text-xs">{e.employee_no}</span>
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={e.status} />
              <Badge variant="neutral">{label(e.employment_type)}</Badge>
              {nbi ? (
                <ExpiryBadge state={nbiState} date={`NBI ${formatDate(nbi)}`} />
              ) : (
                <Badge variant="outline">No NBI clearance on file</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/employees/${e.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
          <DeleteEmployee id={e.id} employeeNo={e.employee_no} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <DetailSection title="Personal">
          <Item label="Birth date">{e.birth_date ? formatDate(e.birth_date) : null}</Item>
          <Item label="Sex">{e.sex ? label(e.sex) : null}</Item>
          <Item label="Civil status">{e.civil_status ? label(e.civil_status) : null}</Item>
          <Item label="Nationality">{e.nationality}</Item>
          <Item label="Personal email">{e.personal_email}</Item>
          <Item label="Mobile">{e.mobile}</Item>
          <Item label="Current address" wide>
            {e.current_address}
          </Item>
          <Item label="Permanent address" wide>
            {e.permanent_address}
          </Item>
        </DetailSection>

        <DetailSection title="Employment">
          <Item label="Date hired">{formatDate(e.date_hired)}</Item>
          <Item label="Date separated">{e.date_separated ? formatDate(e.date_separated) : null}</Item>
          <Item label="Work schedule">{e.work_schedule}</Item>
          <Item label="Timezone">{e.timezone}</Item>
          <Item label="Rate">
            {e.rate != null
              ? `${formatMoney(e.rate, "PHP")}${e.rate_basis ? ` / ${e.rate_basis === "hourly" ? "hour" : "month"}` : ""}`
              : null}
          </Item>
          <Item label="Skills and tools" wide>
            {e.skills.length > 0 && (
              <span className="flex flex-wrap gap-1.5">
                {e.skills.map((s) => (
                  <Badge key={s} variant="brand">
                    {s}
                  </Badge>
                ))}
              </span>
            )}
          </Item>
          {e.history.length > 0 && (
            <Item label="Employment history" wide>
              {e.history
                .map((h) => `${formatDate(h.date_hired)} – ${formatDate(h.date_separated)} (${label(h.separation_status)})`)
                .join("\n")}
            </Item>
          )}
        </DetailSection>

        <DetailSection title="Government IDs">
          <Item label="SSS no.">
            <MaskedValue value={e.sss_no} />
          </Item>
          <Item label="PhilHealth no.">
            <MaskedValue value={e.philhealth_no} />
          </Item>
          <Item label="Pag-IBIG no.">
            <MaskedValue value={e.pagibig_no} />
          </Item>
          <Item label="TIN">
            <MaskedValue value={e.tin} />
          </Item>
        </DetailSection>

        <DetailSection title="Assigned clients">
          <Item label="Clients" wide>
            {e.clients.length > 0 && (
              <ul className="flex flex-col gap-2">
                {e.clients.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/clients/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.company_name}
                    </Link>
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-muted-foreground">since {formatDate(c.assigned_on)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Item>
        </DetailSection>

        <DetailSection title="Payout">
          <Item label="Bank or e-wallet">{e.payout_method}</Item>
          <Item label="Account name">{e.payout_account_name}</Item>
          <Item label="Account number">
            <MaskedValue value={e.payout_account_no} />
          </Item>
        </DetailSection>

        <DetailSection title="Emergency contact">
          <Item label="Name">{e.emergency_name}</Item>
          <Item label="Relationship">{e.emergency_relationship}</Item>
          <Item label="Mobile">{e.emergency_mobile}</Item>
        </DetailSection>

        <DetailSection title="Education">
          <Item label="Highest attainment">{e.education_attainment ? label(e.education_attainment) : null}</Item>
          <Item label="School">{e.education_school}</Item>
          <Item label="Course">{e.education_course}</Item>
        </DetailSection>

        <DetailSection title="Notes">
          <Item label="HR notes" wide>
            {e.notes}
          </Item>
        </DetailSection>

        <DocumentsPanel owner="employees" ownerId={e.id} documents={e.documents} docTypes={EMPLOYEE_DOC_TYPES} className="xl:col-span-2" />
      </div>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(e.updated_at)} by {e.updated_by ?? "—"} · Created {formatDate(e.created_at)} by {e.created_by ?? "—"}
      </p>
    </div>
  );
}

export default function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EmployeeDetail params={params} />
    </Suspense>
  );
}
