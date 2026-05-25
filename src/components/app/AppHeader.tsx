
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

      return true;
    });
  }, [items]);

  const summary = useMemo(() => {
    if (participants.length === 0) return null;
    return calculateSplits(sessionState);
  }, [sessionState]);

  const isStep3Complete = useMemo(() => {
    if (!summary) return false;
    if (summary.settlements.length === 0) return true;
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
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateTo(targetStep) || targetStep === currentStep) {
      dispatch(setStep(targetStep));
    }
  };

  const currentStepInfo = steps.find(s => s.id === currentStep);
  const progressValue = (currentStep / steps.length) * 100;

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Logo />
          {isDemoSession && (
            <Badge variant="secondary" className="hidden sm:inline-flex">Live Demo</Badge>
          )}
        </div>

        {/* Mobile progress indicator */}
        <div className="lg:hidden flex-1 max-w-[180px]">
          <div className="w-full text-center">
            <div className="text-xs font-semibold font-headline text-muted-foreground mb-1.5 tracking-wide uppercase">
              {currentStepInfo?.name}
            </div>
            <Progress value={progressValue} className="h-1" />
          </div>
        </div>

        {/* Desktop step indicator */}
        <nav aria-label="Progress" className="hidden lg:block">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => {
              const isCompleted = step.id < currentStep || stepCompletionStatus[step.id as keyof typeof stepCompletionStatus];
              const isCurrent = step.id === currentStep;
              const isFuture = step.id > currentStep && !stepCompletionStatus[step.id as keyof typeof stepCompletionStatus];
              const isNavigable = canNavigateTo(step.id) || step.id <= currentStep;

              return (
                <React.Fragment key={step.name}>
                  <li className="relative">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={isFuture && !isNavigable}
                      className={cn(
                        "text-left transition-opacity",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        isNavigable && "hover:opacity-75"
                      )}
                      aria-label={`Go to step ${step.id}: ${step.name}`}
                    >
                      <div className="flex items-center gap-3" aria-current={isCurrent ? "step" : undefined}>
                        {/* Step circle — no border, pure tonal fills */}
                        <span className="flex h-9 items-center">
                          {isCompleted ? (
                            // Completed: solid primary fill with check icon
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                              <Check className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                            </span>
                          ) : isCurrent ? (
                            // Active: primary/20 fill with primary dot
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(168,85,247,0.5)]" />
                            </span>
                          ) : (
                            // Future: muted surface
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                            </span>
                          )}
                        </span>

                        {/* Step labels */}
                        <span className="hidden sm:flex flex-col">
                          <span className={cn(
                            "text-sm font-semibold font-headline leading-tight",
                            isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.name}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">{step.description}</span>
                        </span>
                      </div>
                    </button>
                  </li>

                  {/* Connector line */}
                  {stepIdx < steps.length - 1 && (
                    <li className="flex-auto hidden sm:block px-4" aria-hidden="true">
                      <div className={cn(
                        "h-0.5 w-full rounded-full transition-colors duration-300",
                        currentStep > step.id ? 'bg-primary/60' : 'bg-secondary'
                      )} />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>

        <div className="flex-1 flex justify-end items-center gap-2">
          {isDemoSession && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Demo</span>
              </Link>
            </Button>
          )}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
