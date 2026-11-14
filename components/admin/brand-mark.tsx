import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ collapsed = false, href = "/admin", className }: { collapsed?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg", collapsed && "justify-center", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <Image src="/brand/circl-mark.png" alt="circl." width={30} height={30} priority className="h-[30px] w-[30px]" />
      </span>
      <span className={cn("text-[17px] font-semibold tracking-tight text-sidebar-foreground", collapsed && "sr-only")}>
        circl.
        <span className="ml-1.5 align-middle text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/60">
          admin
        </span>
      </span>
    </Link>
  );
}
