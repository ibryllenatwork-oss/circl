import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DetailSection, Item } from "@/components/admin/detail";
import { MaskedValue } from "@/components/admin/masked-value";
import { DevBadge, ExpiryBadge, StatusBadge } from "@/components/admin/badges";
import { DocumentsPanel } from "@/components/admin/documents-panel";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <EmployeePhoto employeeId={e.id} url={photo} name={fullName(e)} />
          <div>
            <h1 className="text-2xl font-bold">
              {fullName(e)}
              {e.nickname && <span className="text-base font-normal text-muted-foreground"> ({e.nickname})</span>}
              {e.created_by === DEV_MANAGER.email && <DevBadge />}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{e.employee_no}</span> · {e.position} · <StatusBadge status={e.status} />
              {nbi && <span>NBI <ExpiryBadge state={nbiState} date={formatDate(nbi)} /></span>}
              {!nbi && <span className="text-xs">No NBI clearance on file</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/employees/${e.id}/edit`}>Edit</Link>
          </Button>
          <DeleteEmployee id={e.id} employeeNo={e.employee_no} />
        </div>
      </div>

      <DetailSection title="Personal">
        <Item label="Birth date">{formatDate(e.birth_date)}</Item>
        <Item label="Sex">{label(e.sex)}</Item>
        <Item label="Civil status">{label(e.civil_status)}</Item>
        <Item label="Nationality">{e.nationality}</Item>
        <Item label="Personal email">{e.personal_email}</Item>
        <Item label="Mobile">{e.mobile}</Item>
        <Item label="Current address" wide>{e.current_address}</Item>
        <Item label="Permanent address" wide>{e.permanent_address}</Item>
      </DetailSection>

      <DetailSection title="Government IDs">
        <Item label="SSS no."><MaskedValue value={e.sss_no} /></Item>
        <Item label="PhilHealth no."><MaskedValue value={e.philhealth_no} /></Item>
        <Item label="Pag-IBIG no."><MaskedValue value={e.pagibig_no} /></Item>
        <Item label="TIN"><MaskedValue value={e.tin} /></Item>
      </DetailSection>

      <DetailSection title="Employment">
        <Item label="Employment type">{label(e.employment_type)}</Item>
        <Item label="Date hired">{formatDate(e.date_hired)}</Item>
        <Item label="Date separated">{e.date_separated ? formatDate(e.date_separated) : null}</Item>
        <Item label="Work schedule">{e.work_schedule}</Item>
        <Item label="Timezone">{e.timezone}</Item>
        <Item label="Rate">
          {e.rate != null ? `${formatMoney(e.rate, "PHP")}${e.rate_basis ? ` / ${e.rate_basis === "hourly" ? "hour" : "month"}` : ""}` : null}
        </Item>
        <Item label="Skills and tools" wide>{e.skills.join(", ")}</Item>
        {e.history.length > 0 && (
          <Item label="Employment history" wide>
            {e.history
              .map((h) => `${formatDate(h.date_hired)} – ${formatDate(h.date_separated)} (${label(h.separation_status)})`)
              .join("\n")}
          </Item>
        )}
      </DetailSection>

      <DetailSection title="Assigned clients">
        <Item label="Clients" wide>
          {e.clients.length > 0 && (
            <ul className="flex flex-col gap-1">
              {e.clients.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/clients/${c.id}`} className="underline-offset-4 hover:underline">
                    {c.company_name}
                  </Link>{" "}
                  <StatusBadge status={c.status} />{" "}
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
        <Item label="Account number"><MaskedValue value={e.payout_account_no} /></Item>
      </DetailSection>

      <DetailSection title="Emergency contact">
        <Item label="Name">{e.emergency_name}</Item>
        <Item label="Relationship">{e.emergency_relationship}</Item>
        <Item label="Mobile">{e.emergency_mobile}</Item>
      </DetailSection>

      <DetailSection title="Education">
        <Item label="Highest attainment">{label(e.education_attainment)}</Item>
        <Item label="School">{e.education_school}</Item>
        <Item label="Course">{e.education_course}</Item>
      </DetailSection>

      <DocumentsPanel owner="employees" ownerId={e.id} documents={e.documents} docTypes={EMPLOYEE_DOC_TYPES} />

      <DetailSection title="Notes">
        <Item label="HR notes" wide>{e.notes}</Item>
      </DetailSection>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(e.updated_at)} by {e.updated_by ?? "—"} · Created {formatDate(e.created_at)} by{" "}
        {e.created_by ?? "—"}
      </p>
    </div>
  );
}

export default function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <EmployeeDetail params={params} />
    </Suspense>
  );
}
