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
  const [isMounted, setIsMounted] = React.useState(false)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // On the server or during initial hydration, only render the trigger.
  if (!isMounted) {
    return <>{children}</>
  }

  // Once mounted on the client, render the appropriate component.
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
