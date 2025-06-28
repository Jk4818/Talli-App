
"use client"

import * as React from "react"
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerTrigger,
} from "@/components/ui/dropdrawer"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button, type ButtonProps } from "./button"
import { cn } from "@/lib/utils"

// Context to manage the state of the select component
interface ResponsiveSelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  setOpen: (open: boolean) => void
}

const ResponsiveSelectContext = React.createContext<ResponsiveSelectContextValue | null>(null)

const useResponsiveSelect = () => {
  const context = React.useContext(ResponsiveSelectContext)
  if (!context) {
    throw new Error("useResponsiveSelect must be used within a ResponsiveSelect component")
  }
  return context
}

// Main component wrapper
const ResponsiveSelect = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) => {
  const [open, setOpen] = React.useState(false)

  const contextValue = React.useMemo(() => ({
    value,
    onValueChange,
    setOpen,
  }), [value, onValueChange, setOpen])

  return (
    <ResponsiveSelectContext.Provider value={contextValue}>
      <DropDrawer open={open} onOpenChange={setOpen}>
        {children}
      </DropDrawer>
    </ResponsiveSelectContext.Provider>
  )
}

// Trigger component
const ResponsiveSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { placeholder?: string }
>(({ children, placeholder, className, ...props }, ref) => {
  return (
    <DropDrawerTrigger asChild>
      <Button
        ref={ref}
        variant="outline"
        role="combobox"
        className={cn("w-full justify-between", className)}
        {...props}
      >
        {children || <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </DropDrawerTrigger>
  )
})
ResponsiveSelectTrigger.displayName = "ResponsiveSelectTrigger"

// Content component
const ResponsiveSelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropDrawerContent>
>(({ children, ...props }, ref) => {
  return <DropDrawerContent ref={ref} {...props}>{children}</DropDrawerContent>
})
ResponsiveSelectContent.displayName = "ResponsiveSelectContent"

// Label component for drawer view
const ResponsiveSelectLabel = React.forwardRef<
    React.ElementRef<typeof DropDrawerLabel>,
    React.ComponentPropsWithoutRef<typeof DropDrawerLabel>
>(({ children, ...props }, ref) => {
    return <DropDrawerLabel ref={ref} {...props}>{children}</DropDrawerLabel>
})
ResponsiveSelectLabel.displayName = "ResponsiveSelectLabel"


// Item component
const ResponsiveSelectItem = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof DropDrawerItem>, "onSelect" | "onClick"> & { value: string }
>(({ children, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = useResponsiveSelect()

  const handleSelect = () => {
    onValueChange?.(value)
    setOpen(false) // Close the drawer/dropdown on selection
  }
  
  const isSelected = selectedValue === value

  return (
    <DropDrawerItem
      ref={ref as React.Ref<HTMLDivElement>}
      onSelect={handleSelect}
      onClick={handleSelect} // For mobile drawer which uses onClick
      icon={isSelected ? <Check className="h-4 w-4" /> : <div className="h-4 w-4" />}
      {...props}
    >
      {children}
    </DropDrawerItem>
  )
})
ResponsiveSelectItem.displayName = "ResponsiveSelectItem"

export {
  ResponsiveSelect,
  ResponsiveSelectTrigger,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
}
