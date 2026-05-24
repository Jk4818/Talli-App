import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — Borderless design system variant
 *
 * No variant uses a border or outline stroke.
 * Depth and differentiation are achieved through:
 *   - Surface tones (primary fill vs. muted/raised surface)
 *   - Ambient glow on hover for primary/accent actions
 *   - Scale feedback on press (active:scale-[0.97])
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-medium",
    "rounded-full transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — Electric Violet fill with ambient glow on hover
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_4px_rgba(168,85,247,0.25)]",

        // Destructive — semantic error surface, no red border
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25",

        // Secondary — raised surface tone, no border
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",

        // Ghost — transparent at rest, raised on hover
        ghost:
          "text-foreground hover:bg-secondary hover:text-foreground",

        // Outline — secondary surface in light, glass in dark
        outline:
          "bg-secondary text-foreground hover:bg-secondary/70 dark:glass dark:hover:bg-secondary/60",

        // Link — text-only, accent coloured
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // Mobile-first: minimum 48px height for all interactive targets
        sm:      "h-10 px-4 text-sm",
        default: "h-12 px-6 text-sm",
        lg:      "h-14 px-8 text-base",
        icon:    "h-12 w-12",
        "icon-sm": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
