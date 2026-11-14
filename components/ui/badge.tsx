import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-border text-muted-foreground",
        success: "bg-badge-success-bg text-badge-success",
        pending: "bg-badge-pending-bg text-badge-pending",
        processing: "bg-badge-processing-bg text-badge-processing",
        error: "bg-badge-error-bg text-badge-error",
        neutral: "bg-badge-neutral-bg text-badge-neutral",
        brand: "bg-badge-brand-bg text-badge-brand",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
