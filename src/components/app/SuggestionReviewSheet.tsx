"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import {
  applySuggestedDiscount,
  ignoreSuggestedDiscount,
  reassignSuggestedDiscount,
  removeDiscount,
} from '@/lib/redux/slices/sessionSlice';
import { formatCurrency, cn } from '@/lib/utils';
import { Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
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
} from '../ui/alert-dialog';

interface SuggestionReviewSheetProps {
  receiptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SuggestionReviewSheet({
  receiptId,
  open,
  onOpenChange,
}: SuggestionReviewSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const { receipts, items } = useSelector((state: RootState) => state.session);

  const receipt = receipts.find((r) => r.id === receiptId);

  // Build the pending suggestions list for this receipt
  const suggestions = (receipt?.discounts || [])
    .filter((d) => d.suggestedItemId)
    .map((discount) => ({
      discount,
      targetItem: items.find((i) => i.id === discount.suggestedItemId),
    }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReassignList, setShowReassignList] = useState(false);

  // Reset index when sheet opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setShowReassignList(false);
    }
  }, [open]);

  // Reset reassign list when index changes
  useEffect(() => {
    setShowReassignList(false);
  }, [currentIndex]);

  // Auto-close when all suggestions resolved
  useEffect(() => {
    if (open && suggestions.length === 0) {
      onOpenChange(false);
    }
  }, [open, suggestions.length, onOpenChange]);

  if (!open || !receipt || suggestions.length === 0) return null;

  // Clamp index
  const safeIndex = Math.min(currentIndex, suggestions.length - 1);
  const { discount, targetItem } = suggestions[safeIndex];
  const isConflict = !!targetItem && discount.amount > targetItem.cost;

  // Items from this receipt for reassignment (excluding the current suggested target)
  const receiptItems = items.filter((i) => i.receiptId === receiptId);

  const handleApply = () => {
    dispatch(applySuggestedDiscount({ receiptId, discountId: discount.id }));
    // List shrinks — stay at same index; if last suggestion, useEffect closes
  };

  const handleApplyToWholeBill = () => {
    dispatch(ignoreSuggestedDiscount({ receiptId, discountId: discount.id }));
  };

  const handleReassign = (newTargetItemId: string) => {
    dispatch(reassignSuggestedDiscount({ receiptId, discountId: discount.id, newTargetItemId }));
    setShowReassignList(false);
  };

  const handleRemove = () => {
    dispatch(removeDiscount({ receiptId, discountId: discount.id }));
  };

  const handleSkip = () => {
    // Advance to next suggestion, or close if last
    if (safeIndex < suggestions.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const content = (
    <div className="flex flex-col">
      <ScrollArea className="max-h-[65vh]">
        <div className="flex flex-col gap-5 px-4 pb-2">

          {/* Progress indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Discount suggestion</span>
            <span>{safeIndex + 1} of {suggestions.length}</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden -mt-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((safeIndex + 1) / suggestions.length) * 100}%` }}
            />
          </div>

          {/* Suggestion card */}
          <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                AI Suggestion
              </div>
              {discount.confidence && (
                <Badge variant="secondary" className="text-primary font-medium text-xs shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {discount.confidence}%
                </Badge>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">{discount.name}</p>
              <p className="text-xl font-bold text-primary mt-0.5">
                -{formatCurrency(discount.amount, receipt.currency)}
              </p>
            </div>
          </div>

          {/* Suggested item */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Suggested for:</p>
            {targetItem ? (
              <div className="rounded-lg border bg-secondary/40 px-3 py-2.5 flex items-center justify-between">
                <span className="font-medium text-sm">{targetItem.name}</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {formatCurrency(targetItem.cost, receipt.currency)}
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive">Item not found — it may have been deleted.</p>
              </div>
            )}
          </div>

          {/* Conflict warning */}
          {isConflict && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Note: this discount is larger than the item cost — applying it would make the item negative.</p>
            </div>
          )}

          <p className="font-semibold">Does this look right?</p>

          {/* Primary action */}
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={handleApply}
              disabled={!targetItem || isConflict}
            >
              <Check className="mr-2 h-4 w-4" />
              Yes, apply to {targetItem?.name ?? 'this item'}
            </Button>

            {/* Reassign — toggle list */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowReassignList((v) => !v)}
                disabled={receiptItems.length <= 1}
              >
                <span className="mr-2">✗</span>
                No — different item
                <span className="ml-auto text-muted-foreground text-xs">
                  {showReassignList ? '▲' : '▼'}
                </span>
              </Button>

              {showReassignList && (
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                  {receiptItems
                    .filter((i) => i.id !== discount.suggestedItemId)
                    .map((item, idx, arr) => (
                      <React.Fragment key={item.id}>
                        <button
                          onClick={() => handleReassign(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-left"
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {formatCurrency(item.cost, receipt.currency)}
                          </span>
                        </button>
                        {idx < arr.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleApplyToWholeBill}
            >
              Apply to whole bill instead
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
                >
                  Remove this discount
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove "{discount.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this discount. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground text-center transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </ScrollArea>
    </div>
  );

  const title = `Discount suggestions (${safeIndex + 1} of ${suggestions.length})`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {content}
          <div className="h-4" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
