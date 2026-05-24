import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge — No border strokes on any variant.
 * Status conveyed through background tint + text color combination (never color alone).
 * label-sm typography: 11px, uppercase, +0.06em tracking for legibility.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        // Brand — violet tint
        default:
          "bg-primary/20 text-primary",

        // Neutral surface
        secondary:
          "bg-secondary text-secondary-foreground",

        // Error — soft red surface
        destructive:
          "bg-destructive/20 text-destructive",

        // Success — emerald surface
        success:
          "bg-success/20 text-success",

        // Warning — amber surface
        warning:
          "bg-warning/20 text-warning",

        // Muted / low-emphasis
        outline:
          "bg-secondary/60 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
