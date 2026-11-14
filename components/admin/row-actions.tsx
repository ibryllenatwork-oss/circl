"use client";

import Link from "next/link";
import { Copy, Eye, MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "./toast";

export function RowActions({ href, label, copy }: { href: string; label: string; copy?: { text: string; what: string } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${label}`}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={href}>
            <Eye className="mr-2 h-4 w-4" /> Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${href}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        {copy && (
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard?.writeText(copy.text);
              toast(`${copy.what} copied.`);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy {copy.what.toLowerCase()}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
