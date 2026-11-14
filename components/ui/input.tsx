import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared look for text inputs, selects and textareas. */
export const fieldClass =
  "w-full rounded-lg border border-input bg-muted px-3 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground/80 hover:border-primary/30 focus-visible:border-primary focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        fieldClass,
        "h-9 py-1 file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
