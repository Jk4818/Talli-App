"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AccessibleTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  popoverContentProps?: React.ComponentProps<typeof PopoverContent>
  tooltipContentProps?: React.ComponentProps<typeof TooltipContent>
}

export function AccessibleTooltip({
  children,
  content,
  popoverContentProps,
  tooltipContentProps,
}: AccessibleTooltipProps) {
  const isMobile = useIsMobile()

  // On the server, isMobile is undefined. We only render the trigger.
  // On the client, it becomes true/false, and we render the correct component.
  // This avoids the hydration mismatch and the state update loop.
  if (isMobile === undefined) {
    return <>{children}</>
  }

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[80vw] text-sm"
          side="bottom"
          align="center"
          {...popoverContentProps}
        >
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent {...tooltipContentProps}>{content}</TooltipContent>
    </Tooltip>
  )
}
