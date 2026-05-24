
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { loadDemoData, resetSession, restoreSession, setStep } from '@/lib/redux/slices/sessionSlice';
import Step1Setup from './Step1Setup';
import Step2Assignment from './Step2Assignment';
import Step3Summary from './Step3Summary';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight, Sparkles, RotateCcw, X } from 'lucide-react';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import type { Discount, Item, Receipt, SessionState } from '@/lib/types';
import SuggestionResolverDialog from './SuggestionResolverDialog';
import { loadDraft, clearDraft } from '@/lib/redux/middleware/localStoragePersist';

export function AppClient({ isDemo }: { isDemo: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { step, participants, items, receipts, isDemoSession } = useSelector((state: RootState) => state.session);
  const [isSuggestionResolverOpen, setIsSuggestionResolverOpen] = useState(false);

  // ── Draft recovery ──────────────────────────────────────────────────────
  const [recoveryDraft, setRecoveryDraft] = useState<{ savedAt: string; session: unknown } | null>(null);

  useEffect(() => {
    if (!isDemo) {
      const draft = loadDraft();
      if (
        draft &&
        draft.session &&
        (
          (draft.session.participants?.length ?? 0) > 0 ||
          (draft.session.receipts?.length ?? 0) > 0
        )
      ) {
        setRecoveryDraft(draft);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecoverSession = () => {
    if (recoveryDraft) {
      dispatch(restoreSession(recoveryDraft.session as Partial<SessionState>));
      setRecoveryDraft(null);
    }
  };

  const handleDismissRecovery = () => {
    clearDraft();
    setRecoveryDraft(null);
  };

  // ── Demo / real session sync ────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) {
      dispatch(loadDemoData());
    } else if (isDemoSession) {
      dispatch(resetSession());
    }
  }, [dispatch, isDemo, isDemoSession]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // ── Pending AI suggestions ──────────────────────────────────────────────
  const pendingSuggestions = useMemo(() => {
    const suggestions: { receiptId: string; discount: Discount; targetItem?: Item }[] = [];
    receipts.forEach((receipt: Receipt) => {
      (receipt.discounts || []).forEach((discount: Discount) => {
        if (discount.suggestedItemId) {
          const targetItem = items.find((i: Item) => i.id === discount.suggestedItemId);
          suggestions.push({ receiptId: receipt.id, discount, targetItem });
        }
      });
    });
    return suggestions;
  }, [receipts, items]);

  const hasPendingSuggestions = pendingSuggestions.length > 0;

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step < 3) dispatch(setStep(step + 1));
  };

  const handleBack = () => {
    if (step > 1) dispatch(setStep(step - 1));
  };

  // ── Step 1 validation ───────────────────────────────────────────────────
  const hasConflictingReceipts = useMemo(() => {
    return receipts.some(receipt => {
      const receiptItems = items.filter(i => i.receiptId === receipt.id);
      const subtotal = receiptItems.reduce((acc, item) => acc + item.cost, 0);
      const totalReceiptDiscounts = (receipt.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const totalItemDiscounts = receiptItems.reduce((acc, i) => acc + (i.discounts || []).reduce((s, d) => s + d.amount, 0), 0);
      const subtotalAfterDiscounts = subtotal - totalReceiptDiscounts - totalItemDiscounts;
      const serviceCharge = receipt.serviceCharge || { type: 'fixed', value: 0 };
      const serviceChargeAmount =
        serviceCharge.type === 'fixed'
          ? serviceCharge.value
          : Math.round(subtotalAfterDiscounts * (serviceCharge.value / 100));
      return subtotalAfterDiscounts + serviceChargeAmount < 0;
    });
  }, [receipts, items]);

  const hasOrphanedItems = useMemo(() => {
    const receiptIds = new Set(receipts.map(r => r.id));
    return items.some(item => !receiptIds.has(item.receiptId));
  }, [items, receipts]);

  const isStep1SetupComplete =
    participants.length > 0 &&
    receipts.length > 0 &&
    receipts.every(r => r.payerId !== null && r.status !== 'processing');

  const step1TooltipMessage = useMemo(() => {
    if (hasConflictingReceipts) return 'Please resolve all receipt conflicts before continuing.';
    if (hasOrphanedItems) return 'Some items are not assigned to a valid receipt.';
    if (participants.length === 0) return 'Please add at least one participant to continue.';
    if (receipts.length === 0) return 'Please upload at least one receipt to continue.';
    if (receipts.some(r => r.status === 'processing')) return 'Please wait for all receipts to finish scanning.';
    if (receipts.some(r => r.payerId === null)) return 'A payer must be assigned to every receipt.';
    return 'Please complete all setup steps to continue.';
  }, [hasConflictingReceipts, participants.length, receipts, hasOrphanedItems]);

  const isStep1Blocked = !isStep1SetupComplete || hasConflictingReceipts || hasOrphanedItems;

  // ── Step 2 validation ───────────────────────────────────────────────────
  const isStep2Complete = useMemo(() => {
    return items.every(item => {
      const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const effectiveCost = item.cost - totalItemDiscount;
      if (effectiveCost <= 0) return true;
      if (item.assignees.length === 0) return false;
      if (item.splitMode === 'percentage') {
        const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments[pid] || 0), 0);
        return totalPercentage === 100;
      }
      if (item.splitMode === 'exact') {
        const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments[pid] || 0), 0);
        return totalExact === effectiveCost;
      }
      return true;
    });
  }, [items]);

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Setup key="step1" />;
      case 2: return <Step2Assignment key="step2" />;
      case 3: return <Step3Summary key="step3" />;
      default: return <Step1Setup key="step-default" />;
    }
  };

  const formattedSavedAt = recoveryDraft
    ? new Date(recoveryDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      {/* ── Draft recovery banner ── */}
      {recoveryDraft && !isDemo && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Unsaved session found</p>
                <p className="text-xs text-muted-foreground">
                  You have a session from {formattedSavedAt} that wasn&apos;t finished.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button size="sm" onClick={handleRecoverSession}>
                Resume session
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismissRecovery} aria-label="Dismiss recovery">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending suggestions banner (non-blocking) ── */}
      {hasPendingSuggestions && step === 1 && (
        <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5">
          <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">{pendingSuggestions.length}</span> AI discount{' '}
                {pendingSuggestions.length === 1 ? 'suggestion' : 'suggestions'} need your review.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 self-end sm:self-auto shrink-0"
              onClick={() => setIsSuggestionResolverOpen(true)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Review suggestions
            </Button>
          </div>
        </div>
      )}

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
                  Assign Items
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
