"use client"

import * as React from "react"
import { useSelector } from "react-redux"
import { type RootState } from "@/lib/redux/store"
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
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);

  // On the server, isMobile is null. Render nothing but the trigger
  // to prevent hydration mismatches.
  if (isMobile === null) {
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
