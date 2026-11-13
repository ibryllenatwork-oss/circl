export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

export function Item({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  const empty = children == null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line break-words text-sm">{empty ? "—" : children}</dd>
    </div>
  );
}
