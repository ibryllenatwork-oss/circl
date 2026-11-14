import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/input";
import { LABELS } from "@/lib/employees/labels";

type Base = {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
};

function Wrapper({ name, label, error, required, hint, className, children }: Base & { children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-[13px] font-medium text-foreground">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (b: Base) => (b.error ? `${b.name}-error` : undefined);

export function TextField({
  defaultValue,
  type = "text",
  placeholder,
  list,
  ...base
}: Base & { defaultValue?: string | number | null; type?: string; placeholder?: string; list?: string }) {
  return (
    <Wrapper {...base}>
      <input
        id={base.name}
        name={base.name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        list={list}
        required={base.required}
        aria-required={base.required}
        aria-invalid={Boolean(base.error)}
        aria-describedby={describedBy(base)}
        step={type === "number" ? "0.01" : undefined}
        className={cn(fieldClass, "h-9 py-1")}
      />
    </Wrapper>
  );
}

export function SelectField({
  defaultValue,
  options,
  allowBlank = true,
  ...base
}: Base & { defaultValue?: string | null; options: readonly string[]; allowBlank?: boolean }) {
  return (
    <Wrapper {...base}>
      <select
        id={base.name}
        name={base.name}
        defaultValue={defaultValue ?? ""}
        required={base.required}
        aria-required={base.required}
        aria-invalid={Boolean(base.error)}
        aria-describedby={describedBy(base)}
        className={cn(fieldClass, "h-9 py-1")}
      >
        {allowBlank && <option value="">Select…</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {LABELS[o] ?? o}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function TextAreaField({ defaultValue, rows = 3, ...base }: Base & { defaultValue?: string | null; rows?: number }) {
  return (
    <Wrapper {...base}>
      <textarea
        id={base.name}
        name={base.name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(base.error)}
        aria-describedby={describedBy(base)}
        className={cn(fieldClass, "py-2")}
      />
    </Wrapper>
  );
}

/** A form section rendered as a white card with a title and optional description. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-tight" aria-hidden>
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export function DataList({ id, options }: { id: string; options: string[] }) {
  return (
    <datalist id={id}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  );
}

/** Sticky bottom bar for form actions. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-border/70 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {children}
    </div>
  );
}

/** Error summary shown above a form after a failed save. */
export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-badge-error-bg px-4 py-3 text-sm font-medium text-badge-error">
      {message}
    </div>
  );
}
