
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { loadDemoData, resetSession, setStep } from '@/lib/redux/slices/sessionSlice';
import Step1Setup from './Step1Setup';
import Step2Assignment from './Step2Assignment';
import Step3Summary from './Step3Summary';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import type { Discount, Item } from '@/lib/types';
import SuggestionResolverDialog from './SuggestionResolverDialog';

export function AppClient({ isDemo }: { isDemo: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { step, participants, items, receipts, isDemoSession } = useSelector((state: RootState) => state.session);
  const [isSuggestionResolverOpen, setIsSuggestionResolverOpen] = useState(false);

  useEffect(() => {
    // This effect synchronizes the session state (demo vs. real) with the current page
    // by running once when the component mounts.
    if (isDemo) {
      // If we are on the demo page, always load a fresh set of demo data.
      dispatch(loadDemoData());
    } else if (isDemoSession) {
      // If we are on the real app page, but the session in the store is a demo session,
      // reset it to a clean, non-demo state.
      dispatch(resetSession());
    }
  }, [dispatch, isDemo, isDemoSession]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const pendingSuggestions = useMemo(() => {
    const suggestions: { receiptId: string; discount: Discount; targetItem?: Item }[] = [];
    receipts.forEach(receipt => {
        (receipt.discounts || []).forEach(discount => {
            if (discount.suggestedItemId) {
                const targetItem = items.find(i => i.id === discount.suggestedItemId);
                suggestions.push({ receiptId: receipt.id, discount, targetItem });
            }
        });
    });
    return suggestions;
  }, [receipts, items]);

  const hasPendingSuggestions = pendingSuggestions.length > 0;

  const handleNext = () => {
    if (step === 1) {
      if (hasPendingSuggestions) {
        setIsSuggestionResolverOpen(true);
        return;
      }
      dispatch(setStep(step + 1));
      return;
    }

    if (step < 3) {
      dispatch(setStep(step + 1));
    }
  };

  const handleBack = () => {
    if (step > 1) {
      dispatch(setStep(step - 1));
    }
  };
  
  const hasConflictingReceipts = useMemo(() => {
    return receipts.some(receipt => {
      const receiptItems = items.filter(i => i.receiptId === receipt.id);
      const subtotal = receiptItems.reduce((acc, item) => acc + item.cost, 0);
      const totalReceiptDiscounts = (receipt.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const totalItemDiscounts = receiptItems.reduce((acc, i) => acc + (i.discounts || []).reduce((s,d)=> s + d.amount, 0),0);

      const subtotalAfterDiscounts = subtotal - totalReceiptDiscounts - totalItemDiscounts;
      
      const serviceCharge = receipt.serviceCharge || { type: 'fixed', value: 0 };
      const serviceChargeAmount = serviceCharge.type === 'fixed'
        ? serviceCharge.value
        : Math.round(subtotalAfterDiscounts * (serviceCharge.value / 100));
      const receiptTotal = subtotalAfterDiscounts + serviceChargeAmount;
      return receiptTotal < 0;
    });
  }, [receipts, items]);
  
  const hasOrphanedItems = useMemo(() => {
    const receiptIds = new Set(receipts.map(r => r.id));
    return items.some(item => !receiptIds.has(item.receiptId));
  }, [items, receipts]);

  const isStep1SetupComplete = participants.length > 0 && receipts.length > 0 && receipts.every(r => r.payerId !== null);
  
  const step1TooltipMessage = useMemo(() => {
    if (hasConflictingReceipts) {
      return 'Please resolve all receipt conflicts before continuing.';
    }
    if (hasOrphanedItems) {
      return 'Some items are not assigned to a valid receipt. Please edit them in the item list below.';
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
  }, [hasConflictingReceipts, participants.length, receipts, hasOrphanedItems]);
  
  const isStep1Blocked = !isStep1SetupComplete || hasConflictingReceipts || hasOrphanedItems;

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
    <>
      <div className="flex-1 bg-background p-4 md:p-8">
        {renderStep()}
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
              isStep1Blocked ? (
                <AccessibleTooltip content={<p>{step1TooltipMessage}</p>}>
                  <span tabIndex={0}>
                    <Button disabled className="pointer-events-none">
                      Assign Items
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </span>
                </AccessibleTooltip>
              ) : (
                <Button onClick={handleNext}>
                  {hasPendingSuggestions ? 'Review Suggestions' : 'Assign Items'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )
            )}
            {step === 2 && (
              isStep2Complete ? (
                <Button onClick={handleNext}>
                  View Summary
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <AccessibleTooltip content={<p>All items must be fully assigned without errors to continue.</p>}>
                  <span tabIndex={0}>
                    <Button disabled className="pointer-events-none">
                      View Summary
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </span>
                </AccessibleTooltip>
              )
            )}
          </div>
        </div>
      </footer>
      <SuggestionResolverDialog 
        isOpen={isSuggestionResolverOpen}
        onOpenChange={setIsSuggestionResolverOpen}
        suggestions={pendingSuggestions}
      />
    </>
  );
}
