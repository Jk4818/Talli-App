"use client";

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { loadDemoData, resetSession, setStep } from '@/lib/redux/slices/sessionSlice';
import Step1Setup from './Step1Setup';
import Step2Assignment from './Step2Assignment';
import Step3Summary from './Step3Summary';
import { AppHeader } from './AppHeader';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function AppClient({ isDemo }: { isDemo: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { step, participants, items, receipts } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    dispatch(resetSession());
    if (isDemo) {
      dispatch(loadDemoData());
    }
  }, [dispatch, isDemo]);

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
        return <Step1Setup />;
      case 2:
        return <Step2Assignment />;
      case 3:
        return <Step3Summary />;
      default:
        return <Step1Setup />;
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-secondary/50">
      <AppHeader />
      <main className="flex-1 py-8 px-4 container mx-auto">
        {renderStep()}
      </main>
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
              <Button onClick={handleNext} disabled={!isStep1Complete}>
                Assign Items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
