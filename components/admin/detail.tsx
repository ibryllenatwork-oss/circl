import { cn } from "@/lib/utils";

export function DetailSection({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/70 bg-card p-5 shadow-card dark:border-border dark:shadow-none sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function Item({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  const empty = children == null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 whitespace-pre-line break-words text-sm", empty && "text-muted-foreground/70")}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}
