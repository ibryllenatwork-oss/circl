"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandMark } from "./brand-mark";
import { NavLinks } from "./nav-links";

/** Below lg: the sidebar becomes a drawer opened from the header. */
export function MobileNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="!h-5 !w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-sidebar gap-6 px-3 py-5 text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Go to a section of the admin.</SheetDescription>
        <div className="px-1.5">
          <BrandMark />
        </div>
        <nav>
          <TooltipProvider>
            <NavLinks isSuperadmin={isSuperadmin} onNavigate={() => setOpen(false)} />
          </TooltipProvider>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
