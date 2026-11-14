"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * A table row that opens the record. On wide screens (≥1280px) a plain click
 * selects the row and opens the preview panel (`previewHref`) instead; modifier
 * clicks, keyboard Enter on the link, and narrow screens go to `href`.
 */
export function SelectableRow({
  href,
  previewHref,
  selected,
  children,
  label,
}: {
  href: string;
  previewHref: string;
  selected: boolean;
  children: React.ReactNode;
  label: string;
}) {
  const router = useRouter();

  const onClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // React events bubble through portals (e.g. the row menu); only handle clicks inside the row.
    if (!e.currentTarget.contains(e.target as Node)) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, [role=menuitem], input, select")) return; // inner controls handle themselves
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (window.matchMedia("(min-width: 1280px)").matches) router.replace(previewHref, { scroll: false });
    else router.push(href);
  };

  return (
    <tr
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      data-label={label}
      className={cn(
        "group cursor-pointer border-t border-border/60 text-sm transition-colors first:border-t-0 hover:bg-accent/50",
        selected && "bg-accent shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-accent",
      )}
    >
      {children}
    </tr>
  );
}
