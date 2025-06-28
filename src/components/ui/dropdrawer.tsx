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

type DropDrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean | null;
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
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const [internalOpen, setInternalOpen] = React.useState(false);

  const effectiveOpen = open ?? internalOpen;
  const effectiveSetOpen = onOpenChange ?? setInternalOpen;

  const value = React.useMemo(() => ({
    open: effectiveOpen,
    setOpen: effectiveSetOpen,
    isMobile,
  }), [effectiveOpen, effectiveSetOpen, isMobile]);

  if (isMobile) {
    return (
      <DropDrawerContext.Provider value={value}>
        <Drawer open={effectiveOpen} onOpenChange={effectiveSetOpen}>
          {children}
        </Drawer>
      </DropDrawerContext.Provider>
    );
  }

  return (
    <DropDrawerContext.Provider value={value}>
      <DropdownMenu open={effectiveOpen} onOpenChange={effectiveSetOpen}>
        {children}
      </DropdownMenu>
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
    <Comp {...props} ref={ref}>
      {children}
    </Comp>
  );
});
DropDrawerTrigger.displayName = "DropDrawerTrigger";

const DropDrawerContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContent> & {drawerClassName?: string}
>(({ children, className, drawerClassName, ...props }, ref) => {
  const { isMobile } = useDropDrawer();

  if (isMobile) {
    return (
      <DrawerContent ref={ref as React.Ref<HTMLDivElement>} className={cn("p-4", drawerClassName)}>
        <div className="flex flex-col gap-2">
            {children}
        </div>
        <DrawerFooter className="pt-4 px-0 pb-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    );
  }

  return (
    <DropdownMenuContent ref={ref} className={className} {...props}>
      {children}
    </DropdownMenuContent>
  );
});
DropDrawerContent.displayName = "DropDrawerContent";

const DropDrawerItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    icon?: React.ReactNode;
  }
>(({ children, icon, className, ...props }, ref) => {
  const { isMobile, setOpen } = useDropDrawer();

  const handleSelect = (event: Event) => {
    props.onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
    }
  };
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "flex items-center gap-3 p-3 -mx-4 rounded-lg text-foreground hover:bg-accent",
          props.disabled && "opacity-50 pointer-events-none",
          className
        )}
        onClick={props.disabled ? undefined : handleClick}
      >
        {icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
        <span className="flex-1">{children}</span>
      </div>
    );
  }

  return (
    <DropdownMenuItem ref={ref} onSelect={handleSelect} className={cn("gap-2", className)} {...props}>
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
    const { isMobile } = useDropDrawer();
    if (isMobile) {
        // Submenus are not supported in drawer mode, just render the trigger as disabled
        const subTrigger = React.Children.toArray(children).find(
            (child) => React.isValidElement(child) && ((child.type as any).displayName === "DropDrawerSubTrigger")
        );
        return <>{subTrigger}</>;
    }
    return <DropdownMenuSub>{children}</DropdownMenuSub>
}
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
            <div className={cn("flex items-center gap-3 p-3 -mx-4 rounded-lg text-foreground opacity-50 cursor-not-allowed", className)}>
                {icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
                <span className="flex-1">{children}</span>
            </div>
        )
    }
    return <DropdownMenuSubTrigger ref={ref} className={cn("gap-2", className)} {...props}>{icon}{children}</DropdownMenuSubTrigger>
});
DropDrawerSubTrigger.displayName = "DropDrawerSubTrigger";

const DropDrawerSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubContent>
>((props, ref) => {
    const { isMobile } = useDropDrawer();
    if (isMobile) {
        return null; // Submenus are not supported in drawer mode
    }
    return (
        <DropdownMenuSubContent ref={ref} {...props} />
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
