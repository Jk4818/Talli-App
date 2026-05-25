"use client";

import React, { useState, useEffect, useRef } from 'react';
import { type Receipt } from '@/lib/types';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import {
  updateReceipt,
  removeReceipt,
  reprocessReceiptFromUri,
} from '@/lib/redux/slices/sessionSlice';
import { useAuth } from '@/lib/firebase/auth';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  FileWarning,
  RefreshCw,
  SlidersHorizontal,
  Pencil,
  AlertCircle,
  CircleCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptImageViewer from './ReceiptImageViewer';
import { cn, formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { Separator } from '../ui/separator';
import BillAdjustmentsSheet from './BillAdjustmentsSheet';
import ReceiptDetailsSheet from './ReceiptDetailsSheet';
import SuggestionReviewSheet from './SuggestionReviewSheet';

// ── Error parsing ────────────────────────────────────────────────────────────

interface ErrorInfo {
  message: string;
  hint: string;
  canRetry: boolean;
}

const getErrorInfo = (error?: string | null): ErrorInfo => {
  if (!error) return { message: 'An unknown error occurred during processing.', hint: 'Try again.', canRetry: true };
  if (error.includes('does not appear to be a receipt'))
    return { message: "This doesn't look like a receipt.", hint: 'Please upload a photo of your bill or itemised invoice.', canRetry: false };
  if (error.includes('unclear to read') || error.includes('blurry'))
    return { message: 'The receipt was too blurry to read.', hint: 'Try a clearer, brighter photo — flat on a surface works best.', canRetry: true };
  if (error === 'timeout')
    return { message: 'Scan timed out after 30 seconds.', hint: 'Your connection may be slow. Try again or check your network.', canRetry: true };
  if (error.includes('AI service failed') || error.includes('coffee break'))
    return { message: 'The AI service is temporarily unavailable.', hint: 'Please wait a moment and try again.', canRetry: true };
  return { message: 'Something went wrong during the scan.', hint: 'Try again with the same image, or enter items manually.', canRetry: true };
};

// ── Processing stage labels ──────────────────────────────────────────────────

const PROCESSING_STAGES = [
  { afterSeconds: 0, label: 'Preparing image…' },
  { afterSeconds: 3, label: 'Reading receipt…' },
  { afterSeconds: 10, label: 'Analysing details…' },
  { afterSeconds: 20, label: 'Almost there…' },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export default function ReceiptCard({
  receipt,
  autoFocusName = false,
}: {
  receipt: Receipt;
  autoFocusName?: boolean;
}) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  // Sheet open states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSuggestionReviewOpen, setIsSuggestionReviewOpen] = useState(false);

  // Card open/closed
  const [isOpen, setIsOpen] = useState(true);

  // Name input ref (for auto-focus)
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── Processing stage label ─────────────────────────────────────────────
  const [processingStageIndex, setProcessingStageIndex] = useState(0);
  const processingStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (receipt.status !== 'processing') {
      processingStartRef.current = null;
      setProcessingStageIndex(0);
      return;
    }
    processingStartRef.current = Date.now();
    setProcessingStageIndex(0);
    const interval = setInterval(() => {
      if (!processingStartRef.current) return;
      const elapsed = (Date.now() - processingStartRef.current) / 1000;
      let next = 0;
      for (let i = PROCESSING_STAGES.length - 1; i >= 0; i--) {
        if (elapsed >= PROCESSING_STAGES[i].afterSeconds) { next = i; break; }
      }
      setProcessingStageIndex(next);
    }, 1000);
    return () => clearInterval(interval);
  }, [receipt.status]);

  const processingLabel = PROCESSING_STAGES[processingStageIndex].label;

  // ── Auto-open when scan completes ──────────────────────────────────────
  const prevStatusRef = useRef(receipt.status);
  useEffect(() => {
    if (prevStatusRef.current === 'processing' && receipt.status === 'processed') {
      setIsOpen(true);
    }
    if (receipt.status === 'failed') {
      setIsOpen(true);
    }
    prevStatusRef.current = receipt.status;
  }, [receipt.status]);

  // ── Auto-focus name input for new manual receipts ──────────────────────
  useEffect(() => {
    if (autoFocusName && nameInputRef.current) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [autoFocusName]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleRetry = () => {
    if (receipt.imageDataUri && user) {
      dispatch(reprocessReceiptFromUri({
        receiptId: receipt.id,
        imageDataUri: receipt.imageDataUri,
        user: { email: user.email, email_verified: user.emailVerified },
      }));
    }
  };

  const handleEnterManually = () => {
    dispatch(updateReceipt({ id: receipt.id, status: 'processed', error: null, imageDataUri: undefined, overallConfidence: undefined }));
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const errorInfo = getErrorInfo(receipt.error);
  const discounts = receipt.discounts || [];
  const pendingSuggestions = discounts.filter((d) => d.suggestedItemId);
  const hasSuggestions = pendingSuggestions.length > 0;
  const isPayerMissing = !receipt.payerId;
  const payerName = receipt.payerId ? participants.find((p) => p.id === receipt.payerId)?.name : null;

  const subtotal = items.filter((i) => i.receiptId === receipt.id).reduce((acc, item) => acc + item.cost, 0);
  const totalReceiptDiscounts = discounts.filter((d) => !d.suggestedItemId).reduce((acc, d) => acc + d.amount, 0);
  const subtotalAfterDiscounts = subtotal - totalReceiptDiscounts;
  const serviceChargeAmount = receipt.serviceCharge?.type === 'fixed'
    ? receipt.serviceCharge.value
    : Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
  const totalItemLevelDiscounts = items
    .filter((i) => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + (item.discounts || []).reduce((s, d) => s + d.amount, 0), 0);
  const receiptTotal = subtotalAfterDiscounts - totalItemLevelDiscounts + serviceChargeAmount;
  const hasConflict = receiptTotal < 0;
  const hasServiceCharge = receipt.serviceCharge && receipt.serviceCharge.value > 0;
  const hasDiscounts = totalReceiptDiscounts > 0;
  const showLowConfidence = receipt.overallConfidence !== undefined && receipt.overallConfidence < 85;
  const isManualEmpty = !receipt.imageDataUri && receipt.status === 'processed' && items.filter((i) => i.receiptId === receipt.id).length === 0;

  // Hide body while processing (nothing to interact with)
  const bodyVisible = isOpen && receipt.status !== 'processing';

  // ── Card status style — tonal bg + inset shadow accent, no border ──────
  const cardBorder = cn(
    'rounded-2xl bg-card shadow-[var(--card-elevation)] dark:shadow-none',
    hasConflict || receipt.status === 'failed'
      ? 'shadow-[var(--card-elevation),inset_3px_0_0_hsl(var(--destructive)/0.6)] bg-destructive/5'
      : isPayerMissing && receipt.status === 'processed'
      ? 'shadow-[var(--card-elevation),inset_3px_0_0_hsl(var(--warning)/0.6)] bg-warning/5'
      : ''
  );

  return (
    <>
      {/* Sheets — rendered via portal, outside card DOM */}
      <ReceiptImageViewer receipt={receipt} isOpen={isViewerOpen} onOpenChange={setIsViewerOpen} />
      <BillAdjustmentsSheet receipt={receipt} open={isAdjustmentsOpen} onOpenChange={setIsAdjustmentsOpen} />
      <ReceiptDetailsSheet receipt={receipt} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <SuggestionReviewSheet receiptId={receipt.id} open={isSuggestionReviewOpen} onOpenChange={setIsSuggestionReviewOpen} />

      <div className={cardBorder}>

        {/* ── HEADER — full-width tap target ──────────────────────────── */}
        <button
          onClick={() => receipt.status !== 'processing' && setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-5 py-4 text-left rounded-2xl transition-colors',
            receipt.status !== 'processing' && 'hover:bg-secondary/20 active:bg-secondary/30',
            bodyVisible && 'rounded-b-none',
          )}
          style={{ minHeight: 64 }}
          disabled={receipt.status === 'processing'}
        >
          {/* Left: name + status badges */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className={cn(
              'text-base font-semibold leading-tight',
              receipt.status === 'processing' && 'text-muted-foreground'
            )}>
              {receipt.status === 'processing' ? processingLabel : receipt.name || 'Untitled receipt'}
            </p>

            {/* Status badge row */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              {/* Processing */}
              {receipt.status === 'processing' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  Scanning…
                </span>
              )}

              {/* Failed */}
              {receipt.status === 'failed' && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <FileWarning className="h-3.5 w-3.5 shrink-0" />
                  Couldn't read
                </span>
              )}

              {/* Payer status (processed only) */}
              {receipt.status === 'processed' && (
                isPayerMissing ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    No payer set
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {payerName} paid
                  </span>
                )
              )}

              {/* AI suggestions */}
              {hasSuggestions && receipt.status === 'processed' && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  {pendingSuggestions.length} suggestion{pendingSuggestions.length > 1 ? 's' : ''}
                </span>
              )}

              {/* Low confidence */}
              {showLowConfidence && receipt.status === 'processed' && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  {receipt.overallConfidence}% confident
                </span>
              )}

              {/* Non-global currency badge — amber when exchange rate is missing */}
              {receipt.currency !== globalCurrency && receipt.status === 'processed' && (
                <span className={cn(
                  "text-[10px] font-semibold font-body uppercase tracking-[0.04em] px-1.5 py-[3px] rounded",
                  receipt.exchangeRate
                    ? "text-muted-foreground bg-secondary/70"
                    : "text-amber-500 bg-amber-500/15"
                )}>
                  {receipt.currency}
                </span>
              )}
            </div>
          </div>

          {/* Right: total + chevron */}
          <div className="flex items-center gap-2.5 shrink-0">
            {receipt.status === 'processed' && (
              <span className={cn(
                'text-lg font-bold tabular-nums',
                hasConflict && 'text-destructive'
              )}>
                {formatCurrency(receiptTotal, receipt.currency)}
              </span>
            )}
            {receipt.status !== 'processing' && (
              <ChevronDown className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-220 shrink-0',
                bodyVisible && 'rotate-180'
              )} />
            )}
          </div>
        </button>

        {/* ── BODY — Framer Motion expand/collapse ────────────────────── */}
        <AnimatePresence initial={false}>
          {bodyVisible && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <div className="h-px bg-secondary/60 mx-5" />

              {receipt.status === 'failed' ? (
                /* ── Failed state ──────────────────────────────────────── */
                <div className="px-5 py-6 flex flex-col items-center text-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <FileWarning className="h-7 w-7 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive">{errorInfo.message}</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{errorInfo.hint}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
                    {errorInfo.canRetry && receipt.imageDataUri && user && (
                      <Button size="sm" onClick={handleRetry} className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try again
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleEnterManually} className="w-full sm:w-auto">
                      Enter manually instead
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:text-destructive">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this failed receipt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the failed scan attempt. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => dispatch(removeReceipt(receipt.id))}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                /* ── Processed body ────────────────────────────────────── */
                <div className="px-5 py-5 space-y-5">

                  {/* Manual receipt help text */}
                  {isManualEmpty && (
                    <div className="rounded-xl bg-secondary/40 border px-4 py-3 text-sm text-muted-foreground">
                      Give this receipt a name, then add items using the review section below.
                    </div>
                  )}

                  {/* Conflict alert */}
                  {hasConflict && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>Receipt total is negative — adjust discounts or item costs.</p>
                    </div>
                  )}

                  {/* AI suggestions banner */}
                  {hasSuggestions && (
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        ✦ {pendingSuggestions.length} discount suggestion{pendingSuggestions.length > 1 ? 's' : ''} — review
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary text-xs ml-2 shrink-0"
                        onClick={() => setIsSuggestionReviewOpen(true)}
                      >
                        Review
                      </Button>
                    </div>
                  )}

                  {/* Name + image viewer */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor={`name-${receipt.id}`} className="text-sm font-medium text-muted-foreground">
                        Receipt name
                      </Label>
                      <Input
                        id={`name-${receipt.id}`}
                        ref={nameInputRef}
                        defaultValue={receipt.name}
                        onBlur={(e) => dispatch(updateReceipt({ id: receipt.id, name: e.target.value }))}
                        className="h-12 text-base"
                        maxLength={50}
                      />
                    </div>
                    {receipt.imageDataUri && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 shrink-0 mt-6"
                        onClick={() => setIsViewerOpen(true)}
                      >
                        <ImageIcon className="h-5 w-5" />
                        <span className="sr-only">View receipt image</span>
                      </Button>
                    )}
                  </div>

                  {/* Paid by */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      Paid by
                      {isPayerMissing && (
                        <span className="font-normal text-amber-600">— required to continue</span>
                      )}
                    </Label>
                    <ResponsiveSelect
                      onValueChange={(payerId) => dispatch(updateReceipt({ id: receipt.id, payerId }))}
                      value={receipt.payerId ?? undefined}
                    >
                      <ResponsiveSelectTrigger
                        className={cn(
                          'w-full h-12 text-base',
                          isPayerMissing && 'ring-2 ring-amber-400 focus:ring-amber-400'
                        )}
                        disabled={participants.length === 0}
                      >
                        {receipt.payerId
                          ? participants.find((p) => p.id === receipt.payerId)?.name
                          : (
                            <span className="text-muted-foreground">
                              {participants.length > 0 ? 'Select who paid' : 'Add participants first'}
                            </span>
                          )}
                      </ResponsiveSelectTrigger>
                      <ResponsiveSelectContent>
                        <ResponsiveSelectLabel>Who paid?</ResponsiveSelectLabel>
                        {participants.map((p) => (
                          <ResponsiveSelectItem key={p.id} value={p.id}>{p.name}</ResponsiveSelectItem>
                        ))}
                      </ResponsiveSelectContent>
                    </ResponsiveSelect>
                  </div>

                  {/* Financial summary */}
                  <div className="rounded-xl bg-secondary/30 px-4 py-4 space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatCurrency(subtotal, receipt.currency)}</span>
                    </div>

                    {hasServiceCharge && (
                      <div className="flex justify-between">
                        <button
                          onClick={() => setIsAdjustmentsOpen(true)}
                          className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors text-left"
                        >
                          Service &amp; tips
                          {receipt.serviceCharge.type === 'percentage' && ` (${receipt.serviceCharge.value}%)`}
                        </button>
                        <span className="font-mono">{formatCurrency(serviceChargeAmount, receipt.currency)}</span>
                      </div>
                    )}

                    {hasDiscounts && (
                      <div className="flex justify-between">
                        <button
                          onClick={() => setIsAdjustmentsOpen(true)}
                          className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                        >
                          Discounts
                        </button>
                        <span className="font-mono text-emerald-600">
                          -{formatCurrency(totalReceiptDiscounts, receipt.currency)}
                        </span>
                      </div>
                    )}

                    <Separator className="opacity-50" />

                    {/* Total — local currency + optional conversion line */}
                    <div className="flex justify-between items-start font-semibold text-base">
                      <span>Total</span>
                      <div className="text-right">
                        <span className={cn('font-mono', hasConflict && 'text-destructive')}>
                          {formatCurrency(receiptTotal, receipt.currency)}
                        </span>
                        {receipt.currency !== globalCurrency && (
                          <button
                            onClick={() => setIsDetailsOpen(true)}
                            className="block mt-0.5 ml-auto"
                            aria-label="Edit exchange rate"
                          >
                            {receipt.exchangeRate ? (
                              // Rate set — show converted equivalent
                              <span className="text-xs font-normal font-body text-muted-foreground tabular-nums">
                                ≈&nbsp;{formatCurrency(Math.round(receiptTotal * receipt.exchangeRate), globalCurrency)}
                              </span>
                            ) : (
                              // Rate missing — amber prompt to set it
                              <span className="text-[10px] font-semibold font-body uppercase tracking-[0.04em] text-amber-500 bg-amber-500/15 px-1.5 py-[3px] rounded">
                                Set rate
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 text-sm"
                      onClick={() => setIsAdjustmentsOpen(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                      {hasServiceCharge || hasDiscounts ? 'Edit adjustments' : 'Add discount or tip'}
                    </Button>
                    <button
                      onClick={() => setIsDetailsOpen(true)}
                      className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors flex items-center gap-1.5 rounded-lg hover:bg-secondary/40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit details
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
