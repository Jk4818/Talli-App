import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — Borderless dark surface.
 * No border at rest. Focus state indicated exclusively by an Electric Cyan
 * ambient glow ring (box-shadow) — not a border-color change.
 * Error states are communicated via background tint + label text, never a red stroke.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout & shape
          "flex h-12 w-full rounded-sm px-4 py-3",
          // Surface — raised layer above card
          "bg-secondary text-foreground",
          // Typography
          "text-sm font-body placeholder:text-muted-foreground",
          // No border at rest — focus uses glow only
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.25)]",
          // File input reset
          "file:bg-transparent file:text-sm file:font-medium file:text-foreground file:border-0",
          // States
          "disabled:cursor-not-allowed disabled:opacity-40",
          "transition-shadow duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
