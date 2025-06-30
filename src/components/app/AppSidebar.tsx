
'use client';

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { setStep } from '@/lib/redux/slices/sessionSlice';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { Logo } from '../Logo';
import { Check, Dot } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, name: 'Setup', description: 'Add participants & receipts' },
    { id: 2, name: 'Assign', description: 'Split items between friends' },
    { id: 3, name: 'Settle', description: 'See who owes what' },
];

export default function AppSidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const { step: currentStep, participants, items, receipts } = useSelector((state: RootState) => state.session);

  const isStep1Complete = participants.length > 0 && receipts.length > 0 && receipts.every(r => r.payerId !== null);
  
  const isStep2Complete = useMemo(() => {
    return items.every(item => {
      const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const effectiveCost = item.cost - totalItemDiscount;

      if (effectiveCost <= 0) return true;
      if (item.assignees.length === 0) return false;

      if (item.splitMode === 'percentage') {
        if (!item.percentageAssignments) return false;
        const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments[pid] || 0), 0);
        return totalPercentage === 100;
      }
  
      if (item.splitMode === 'exact') {
        if (!item.exactAssignments) return false;
        const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments[pid] || 0), 0);
        return totalExact === effectiveCost;
      }
      
      return true; // 'equal' split is always valid if assignees exist.
    });
  }, [items]);

  const canNavigateTo = (targetStep: number) => {
    if (targetStep < currentStep) return true;
    if (targetStep > currentStep) {
      if (targetStep === 2) return isStep1Complete;
      if (targetStep === 3) return isStep1Complete && isStep2Complete;
    }
    return false; // Can't navigate to current step or invalid future step
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateTo(targetStep) || targetStep === currentStep) {
      dispatch(setStep(targetStep));
    }
  };

  const getStepStatusIcon = (stepId: number) => {
    if (stepId < currentStep) {
      return <Check className="h-5 w-5 text-primary" />;
    }
    if (stepId === currentStep) {
      return <Dot className="h-8 w-8 text-primary" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-border" />;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {steps.map(step => (
            <SidebarMenuItem key={step.id}>
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!canNavigateTo(step.id) && step.id > currentStep}
                className={cn(
                  "w-full text-left p-2 rounded-md flex items-center gap-4 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  (canNavigateTo(step.id) || step.id <= currentStep) ? "hover:bg-sidebar-accent" : "",
                  step.id === currentStep && "bg-sidebar-accent"
                )}
                aria-label={`Go to step ${step.id}: ${step.name}`}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                    {getStepStatusIcon(step.id)}
                </div>
                <div className='flex flex-col'>
                    <span className={cn(
                        "font-medium",
                        step.id === currentStep ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                    )}>{step.name}</span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>
                </div>
              </button>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
