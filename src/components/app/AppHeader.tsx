
"use client";

import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { setStep } from '@/lib/redux/slices/sessionSlice';
import { Logo } from '../Logo';
import { cn } from '@/lib/utils';
import { Check, LogOut } from 'lucide-react';
import React, { useMemo } from 'react';
import { UserNav } from '../auth/UserNav';
import { calculateSplits } from '@/lib/splitter';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const steps = [
    { id: 1, name: 'Setup', description: 'Add participants & receipts' },
    { id: 2, name: 'Assign', description: 'Split items between friends' },
    { id: 3, name: 'Settle', description: 'See who owes what' },
]

export function AppHeader() {
  const dispatch = useDispatch<AppDispatch>();
  const sessionState = useSelector((state: RootState) => state.session);
  const { step: currentStep, participants, items, receipts, paidSettlements, isDemoSession } = sessionState;

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

  const summary = useMemo(() => {
    if (participants.length === 0) return null;
    return calculateSplits(sessionState);
  }, [sessionState]);

  const isStep3Complete = useMemo(() => {
    if (!summary) return false;
    if (summary.settlements.length === 0) return true; // Already settled
    return summary.settlements.every(s => paidSettlements[s.id]);
  }, [summary, paidSettlements]);

  const stepCompletionStatus = {
    1: isStep1Complete,
    2: isStep1Complete && isStep2Complete,
    3: isStep1Complete && isStep2Complete && isStep3Complete,
  };


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

  const currentStepInfo = steps.find(s => s.id === currentStep);
  const progressValue = (currentStep / steps.length) * 100;

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <Logo />
          {isDemoSession && (
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/80 text-primary">Live Demo</Badge>
          )}
        </div>

        {/* Mobile progress indicator */}
        <div className="lg:hidden flex-1 max-w-[200px]">
            <div className="w-full text-center">
                <div className="text-sm font-semibold text-foreground mb-1">{currentStepInfo?.name}</div>
                <Progress value={progressValue} className="h-2" />
            </div>
        </div>

        {/* Desktop progress indicator */}
        <nav aria-label="Progress" className="hidden lg:block">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
              <React.Fragment key={step.name}>
                <li className="relative">
                    <button
                        onClick={() => handleStepClick(step.id)}
                        disabled={!canNavigateTo(step.id) && step.id > currentStep}
                        className={cn(
                            "text-left disabled:cursor-not-allowed",
                            (canNavigateTo(step.id) || step.id <= currentStep) && "transition-opacity hover:opacity-75"
                        )}
                        aria-label={`Go to step ${step.id}: ${step.name}`}
                    >
                    {step.id < currentStep || stepCompletionStatus[step.id as keyof typeof stepCompletionStatus] ? (
                      <div className="flex items-center">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                            <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="flex items-center" aria-current="step">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold text-primary">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                            <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold text-muted-foreground">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    )}
                  </button>
                </li>

                {stepIdx < steps.length - 1 ? (
                  <li className="flex-auto hidden sm:block px-4" aria-hidden="true">
                     <div className={cn(
                        "h-0.5 w-full",
                        currentStep > step.id ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  </li>
                ) : null}
              </React.Fragment>
            ))}
          </ol>
        </nav>
        <div className="flex-1 flex justify-end items-center gap-4">
            {isDemoSession && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit Demo
                </Link>
              </Button>
            )}
            <UserNav />
        </div>
      </div>
    </header>
  );
}
