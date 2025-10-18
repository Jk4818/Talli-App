"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { type RootState } from "@/lib/redux/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

type DropDrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean | null;
  viewStack: React.ReactNode[];
  pushView: (view: React.ReactNode) => void;
  popView: () => void;
};

const DropDrawerContext = React.createContext<DropDrawerContextValue | null>(null);

const useDropDrawer = () => {
  const context = React.useContext(DropDrawerContext);
  if (!context) {
    throw new Error("useDropDrawer must be used within a DropDrawerProvider");
  }
  return context;
};

const DropDrawer = ({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [viewStack, setViewStack] = React.useState<React.ReactNode[]>([]);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  React.useEffect(() => {
    if (!open) {
      setViewStack([]);
    }
  }, [open]);

  const pushView = (view: React.ReactNode) => {
    setViewStack(prev => [...prev, view]);
  };
  
  const popView = () => {
    setViewStack(prev => prev.slice(0, -1));
  };
  
  const value: DropDrawerContextValue = {
    open,
    setOpen,
    isMobile,
    viewStack,
    pushView,
    popView,
  };

  const Comp = isMobile ? Drawer : DropdownMenu;
  return (
    <DropDrawerContext.Provider value={value}>
      <Comp open={open} onOpenChange={setOpen}>
        {children}
      </Comp>
    </DropDrawerContext.Provider>
  );
};
DropDrawer.displayName = "DropDrawer";

const DropDrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuTrigger>
>(({ children, ...props }, ref) => {
  const { isMobile } = useDropDrawer();
  const Comp = isMobile ? DrawerTrigger : DropdownMenuTrigger;
  return (
    <Comp {...props} ref={ref} asChild>
        {children}
    </Comp>
  );
});
DropDrawerTrigger.displayName = "DropDrawerTrigger";


const DropDrawerContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContent> & {drawerClassName?: string}
>(({ children, className, drawerClassName, align = "end", ...props }, ref) => {
  const { isMobile, viewStack, popView } = useDropDrawer();
  
  const activeView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : children;
  
  if (isMobile) {
    return (
      <DrawerContent ref={ref as React.Ref<HTMLDivElement>} className={cn("flex flex-col h-max max-h-[90vh]", drawerClassName)}>
        {viewStack.length > 0 && (
          <DrawerHeader className="p-4 border-b flex-shrink-0">
             <Button variant="ghost" size="sm" className="justify-start w-fit p-0 h-auto" onClick={popView}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </DrawerHeader>
        )}
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
                <div className="flex flex-col gap-1 p-4">
                    {activeView}
                </div>
            </ScrollArea>
        </div>
        <DrawerFooter className="pt-4 flex-shrink-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    );
  }

  return (
    <DropdownMenuContent ref={ref} className={className} align={align} {...props}>
      {children}
    </DropdownMenuContent>
  );
});
DropDrawerContent.displayName = "DropDrawerContent";

const DropDrawerItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    icon?: React.ReactNode;
  }
>(({ children, icon, className, onSelect, ...props }, ref) => {
  const { isMobile, setOpen } = useDropDrawer();

  const handleInteraction = (event: React.MouseEvent<HTMLDivElement>) => {
    const isTrigger = props.role === 'menuitem' && (event.currentTarget.getAttribute('aria-haspopup') === 'true' || event.currentTarget.getAttribute('data-state') === 'open');

    // Propagate the original onClick if it exists.
    props.onClick?.(event);
    
    // The `onSelect` prop from DropdownMenuItem is used to control closing.
    // If it's present, we call it. It might call `event.preventDefault()`.
    if (onSelect) {
      const selectEvent = new CustomEvent("select", { cancelable: true });
      onSelect(selectEvent);
      if (selectEvent.defaultPrevented) {
        return; // If `preventDefault` was called, do not close the drawer.
      }
    }
    
    // If it's not a sub-trigger, close the drawer.
    if (!isTrigger) {
      setOpen(false);
    }
  };

  if (isMobile) {
    const { asChild } = props;
    const Comp = asChild ? Slot : "div";

    // Detect if this item is a trigger for a dialog/sub-component
    const isAlertDialogTrigger = onSelect?.toString().includes("preventDefault");
    
    const mobileProps = {
      ...props,
      ref: ref,
      className: cn(
        "flex items-center gap-3 p-3 -mx-1 rounded-lg text-foreground",
        !props.disabled && "active:bg-accent",
        props.disabled && "opacity-50 pointer-events-none",
        className
      ),
      onClick: handleInteraction,
      // Add this attribute if it's a trigger, to prevent vaul from closing the drawer.
      ...(isAlertDialogTrigger && { "data-vaul-no-close": "" }),
    };

    return (
      <Comp {...mobileProps}>
        {icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
        <span className="flex-1">{children}</span>
      </Comp>
    );
  }

  return (
    <DropdownMenuItem ref={ref} onSelect={onSelect} {...props} className={cn("gap-2", className)}>
      {icon}
      {children}
    </DropdownMenuItem>
  );
});
DropDrawerItem.displayName = "DropDrawerItem";


const DropDrawerLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuLabel>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuLabel>
>(({ className, ...props }, ref) => {
  const { isMobile } = useDropDrawer();
  if (isMobile) {
    return (
      <DrawerHeader className="p-0 mb-2 text-left">
        <DrawerTitle className={cn("text-sm font-semibold text-muted-foreground", className)} {...props} />
      </DrawerHeader>
    );
  }
  return <DropdownMenuLabel ref={ref} className={className} {...props} />;
});
DropDrawerLabel.displayName = "DropDrawerLabel";

const DropDrawerSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSeparator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSeparator>
>((props, ref) => {
  const { isMobile } = useDropDrawer();
  if (isMobile) {
    return <div className="h-px bg-muted -mx-4 my-2" />;
  }
  return <DropdownMenuSeparator ref={ref} {...props} />;
});
DropDrawerSeparator.displayName = "DropDrawerSeparator";

const DropDrawerGroup = React.forwardRef<
  React.ElementRef<typeof DropdownMenuGroup>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuGroup>
>(({ children, ...props }, ref) => {
    const { isMobile } = useDropDrawer();
    if (isMobile) {
        return <div className="space-y-1" ref={ref as React.Ref<HTMLDivElement>} {...props}>{children}</div>
    }
  return <DropdownMenuGroup ref={ref} {...props}>{children}</DropdownMenuGroup>;
});
DropDrawerGroup.displayName = "DropDrawerGroup";


const DropDrawerSub = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, pushView } = useDropDrawer();

  const subTrigger = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.type as any).displayName === 'DropDrawerSubTrigger'
  );
  const subContent = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.type as any).displayName === 'DropDrawerSubContent'
  );

  if (isMobile) {
    if (!subTrigger || !React.isValidElement(subTrigger)) {
      return null;
    }
    // Clone the trigger and inject the onClick handler to push the content to the view stack
    return React.cloneElement(subTrigger, {
      onClick: () => pushView(subContent),
    });
  }

  return <DropdownMenuSub>{children}</DropdownMenuSub>;
};
DropDrawerSub.displayName = "DropDrawerSub";


const DropDrawerSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubTrigger> & {
    icon?: React.ReactNode;
  }
>(({ children, icon, className, ...props }, ref) => {
    const { isMobile } = useDropDrawer();
    
    if (isMobile) {
        return (
            <div ref={ref as React.Ref<HTMLDivElement>} className={cn("flex items-center gap-3 p-3 -mx-1 rounded-lg text-foreground active:bg-accent", className)} {...props}>
                {icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
                <span className="flex-1">{children}</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
            </div>
        )
    }
    return <DropdownMenuSubTrigger ref={ref} className={cn("gap-2", className)} {...props}>{icon}{children}</DropdownMenuSubTrigger>
});
DropDrawerSubTrigger.displayName = "DropDrawerSubTrigger";

const DropDrawerSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubContent>
>(({children, ...props}, ref) => {
    const { isMobile } = useDropDrawer();
    if (isMobile) {
        // This content is programmatically pushed to the view stack on mobile.
        // It does not render itself directly.
        return <>{children}</>;
    }
    return (
        <DropdownMenuSubContent ref={ref} {...props}>
            {children}
        </DropdownMenuSubContent>
    );
});
DropDrawerSubContent.displayName = "DropDrawerSubContent";


export {
  DropDrawer,
  DropDrawerTrigger,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerGroup,
  DropDrawerSub,
  DropDrawerSubTrigger,
  DropDrawerSubContent,
};
