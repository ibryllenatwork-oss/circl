import Link from "next/link";
import { cn } from "@/lib/utils";

/** Segmented tabs shared by the Catalog and Packages pages. */
export function ServicesTabs({ active }: { active: "catalog" | "packages" }) {
  const tab = (key: "catalog" | "packages", href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
        active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Services & Rates sections" className="mb-6 inline-flex rounded-lg bg-accent/70 p-1">
      {tab("catalog", "/admin/services", "Catalog")}
      {tab("packages", "/admin/services/packages", "Packages")}
    </nav>
  );
}
