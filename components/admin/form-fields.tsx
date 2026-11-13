import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/employees/labels";

const control =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

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
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

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
        aria-invalid={Boolean(base.error)}
        aria-describedby={base.error ? `${base.name}-error` : undefined}
        step={type === "number" ? "0.01" : undefined}
        className={cn(control, "h-9 py-1", base.error && "border-red-500")}
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
        aria-invalid={Boolean(base.error)}
        className={cn(control, "h-9 py-1", base.error && "border-red-500")}
      >
        {allowBlank && <option value="">—</option>}
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
        className={cn(control, base.error && "border-red-500")}
      />
    </Wrapper>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
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
