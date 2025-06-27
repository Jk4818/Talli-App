
"use client";

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { loadDemoData, resetSession, setStep } from '@/lib/redux/slices/sessionSlice';
import Step1Setup from './Step1Setup';
import Step2Assignment from './Step2Assignment';
import Step3Summary from './Step3Summary';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { AnimatePresence } from 'framer-motion';

export function AppClient({ isDemo }: { isDemo: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { step, participants, items, receipts, isDemoSession } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    if (isDemo) {
      dispatch(loadDemoData());
    } else {
      // On the main app, if we are in a demo session, reset it.
      // This happens if a user navigates from /demo to /app.
      if (isDemoSession) {
        dispatch(resetSession());
      }
    }
  }, [dispatch, isDemo, isDemoSession]);


  const handleNext = () => {
    if (step < 3) {
      dispatch(setStep(step + 1));
    }
  };

  const handleBack = () => {
    if (step > 1) {
      dispatch(setStep(step - 1));
    }
  };
  
  const isStep1Complete = participants.length > 0 && receipts.length > 0 && receipts.every(r => r.payerId !== null);
  const hasAmbiguousItems = items.some(item => item.isAmbiguous);
  
  const step1TooltipMessage = useMemo(() => {
    if (hasAmbiguousItems) {
      return 'Please resolve all ambiguous items before continuing.';
    }
    if (participants.length === 0) {
        return 'Please add at least one participant to continue.';
    }
    if (receipts.length === 0) {
        return 'Please upload at least one receipt to continue.';
    }
    if (receipts.some(r => r.payerId === null)) {
        return 'A payer must be assigned to every receipt.';
    }
    return 'Please complete all setup steps to continue.';
  }, [hasAmbiguousItems, participants.length, receipts]);

  const isStep2Complete = useMemo(() => {
    return items.every(item => {
      if (item.cost === 0) return true;
      if (item.assignees.length === 0) return false;

      if (item.splitMode === 'percentage') {
        if (!item.percentageAssignments) return false;
        const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments[pid] || 0), 0);
        return totalPercentage === 100;
      }
  
      if (item.splitMode === 'exact') {
        if (!item.exactAssignments) return false;
        const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments[pid] || 0), 0);
        return totalExact === item.cost;
      }
      
      return true; // 'equal' split is always valid if assignees exist.
    });
  }, [items]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Setup key="step1" />;
      case 2:
        return <Step2Assignment key="step2" />;
      case 3:
        return <Step3Summary key="step3" />;
      default:
        return <Step1Setup key="step-default"/>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {step === 1 && (
              !isStep1Complete || hasAmbiguousItems ? (
                <AccessibleTooltip content={<p>{step1TooltipMessage}</p>}>
                  {/* The span wrapper is crucial for the tooltip to work on a disabled button */}
                  <span tabIndex={0}>
                    <Button disabled className="pointer-events-none">
                      Assign Items
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </span>
                </AccessibleTooltip>
              ) : (
                <Button onClick={handleNext}>
                  Assign Items
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )
            )}
            {step === 2 && (
              <Button onClick={handleNext} disabled={!isStep2Complete}>
                View Summary
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
