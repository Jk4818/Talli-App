"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Item, Receipt, Discount } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Check,
  Pencil,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { Separator } from '../ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import {
  applySuggestedDiscount,
  ignoreSuggestedDiscount,
  reassignSuggestedDiscount,
  removeDiscount,
} from '@/lib/redux/slices/sessionSlice';
import { Badge } from '../ui/badge';
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerTrigger,
} from '../ui/dropdrawer';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { ScrollArea } from '../ui/scroll-area';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Clamp a raw quantity value to a safe positive integer.
 * Handles NaN, Infinity, 0, negatives, and non-integer values that can
 * arrive from AI receipt parsing or corrupt Redux state.
 */
function safeQuantity(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.round(n);
}

/**
 * Detect the iOS software keyboard height via the Visual Viewport API.
 *
 * On iOS, the layout viewport does NOT resize when the keyboard appears —
 * the keyboard overlays the content instead. `window.visualViewport.height`
 * shrinks while `window.innerHeight` stays constant, giving us the exact
 * keyboard height.
 *
 * On Android, BOTH heights shrink together (the layout viewport resizes), so
 * their difference stays near 0 — this hook returns 0 on Android, which is
 * the correct behaviour since the fixed drawer already moves up with the
 * viewport there.
 */
function useIosKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kb = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setInset(kb);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return inset;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemEditDialogProps {
  item: Item | null;
  items: Item[];
  receipts: Receipt[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updates: Partial<Item>) => void;
  onDelete: (itemId: string) => void;
  pendingSuggestion: { receiptId: string; discount: Discount } | null;
}

const CATEGORIES = [
  { value: 'Food',  label: 'Food',  emoji: '🍕' },
  { value: 'Drink', label: 'Drink', emoji: '🍺' },
  { value: 'Other', label: 'Other', emoji: '🛍️' },
] as const;

// ─── Shared form body ─────────────────────────────────────────────────────────

interface FormBodyProps {
  item: Item;
  items: Item[];
  receipts: Receipt[];
  pendingSuggestion: { receiptId: string; discount: Discount } | null;
  // form state
  name: string; setName: (v: string) => void;
  unitCostStr: string; setUnitCostStr: (v: string) => void;
  quantity: number; setQuantity: (v: number) => void;
  receiptId: string; setReceiptId: (v: string) => void;
  category: 'Food' | 'Drink' | 'Other'; setCategory: (v: 'Food' | 'Drink' | 'Other') => void;
  subCategory: string; setSubCategory: (v: string) => void;
  discounts: Discount[];
  discountAmountStrings: Record<string, string>;
  onAddDiscount: () => void;
  onDiscountNameChange: (id: string, v: string) => void;
  onDiscountAmountStringChange: (id: string, v: string) => void;
  onDiscountAmountBlur: (id: string) => void;
  onRemoveDiscount: (id: string) => void;
  onApplySuggestion: () => void;
  onIgnoreSuggestion: () => void;
  onReassignSuggestion: (newTargetItemId: string) => void;
  onRemoveSuggestion: () => void;
  isSuggestionConflict: boolean;
  effectiveCost: number;
  originalCostInCents: number;
  currentReceiptCurrency: string;
}

function FormBody({
  item, items, receipts, pendingSuggestion,
  name, setName,
  unitCostStr, setUnitCostStr,
  quantity, setQuantity,
  receiptId, setReceiptId,
  category, setCategory,
  subCategory, setSubCategory,
  discounts, discountAmountStrings,
  onAddDiscount, onDiscountNameChange,
  onDiscountAmountStringChange, onDiscountAmountBlur,
  onRemoveDiscount,
  onApplySuggestion, onIgnoreSuggestion,
  onReassignSuggestion, onRemoveSuggestion,
  isSuggestionConflict,
  effectiveCost, originalCostInCents,
  currentReceiptCurrency,
}: FormBodyProps) {

  // Safe display value — guards the stepper span against any lingering NaN
  const displayQty = Number.isFinite(quantity) && quantity >= 1 ? quantity : 1;

  return (
    <div className="space-y-5">

      {/* ── AI Suggestion panel ── */}
      {pendingSuggestion && (
        <div className="rounded-xl bg-primary/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              AI Discount Suggestion
            </div>
            {pendingSuggestion.discount.confidence && (
              <Badge variant="secondary" className="text-primary font-medium shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                {pendingSuggestion.discount.confidence}%
              </Badge>
            )}
          </div>

          {isSuggestionConflict && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conflict</AlertTitle>
              <AlertDescription>
                This discount exceeds the item cost. Reassign or remove it.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Apply{' '}
            <span className="font-medium text-foreground">
              &quot;{pendingSuggestion.discount.name}&quot;
            </span>{' '}
            (
            <span className="text-destructive font-mono">
              -{formatCurrency(pendingSuggestion.discount.amount, currentReceiptCurrency)}
            </span>
            ) to this item?
          </p>

          {/* Action buttons — full-width stacked on mobile */}
          <div className="flex flex-col gap-2">
            <AccessibleTooltip
              content={
                isSuggestionConflict
                  ? 'Discount exceeds item cost.'
                  : 'Apply to this item'
              }
            >
              <span className="w-full" tabIndex={0}>
                <Button
                  size="sm"
                  type="button"
                  className="w-full"
                  onClick={onApplySuggestion}
                  disabled={isSuggestionConflict}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply to this item
                </Button>
              </span>
            </AccessibleTooltip>

            <DropDrawer>
              <DropDrawerTrigger asChild>
                <Button size="sm" type="button" variant="outline" className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Reassign to another item
                </Button>
              </DropDrawerTrigger>
              <DropDrawerContent>
                <DropDrawerLabel>Reassign to another item</DropDrawerLabel>
                {items
                  .filter(
                    (i) =>
                      i.receiptId === pendingSuggestion.receiptId &&
                      i.id !== item.id,
                  )
                  .map((otherItem) => (
                    <DropDrawerItem
                      key={otherItem.id}
                      onClick={() => onReassignSuggestion(otherItem.id)}
                    >
                      {otherItem.name}
                    </DropDrawerItem>
                  ))}
                {items.filter(
                  (i) =>
                    i.receiptId === pendingSuggestion.receiptId &&
                    i.id !== item.id,
                ).length === 0 && (
                  <DropDrawerItem disabled>
                    No other items on this receipt
                  </DropDrawerItem>
                )}
              </DropDrawerContent>
            </DropDrawer>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onIgnoreSuggestion}
            >
              <Layers className="mr-2 h-4 w-4" />
              Make receipt-wide discount
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove discount
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this discount?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes &quot;
                    {pendingSuggestion.discount.name}&quot;. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemoveSuggestion}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* ── Item name ── */}
      <div className="space-y-1.5">
        <Label htmlFor="item-name">Item name</Label>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Margherita Pizza"
          className="h-11 text-base"
          autoFocus
        />
      </div>

      {/* ── Quantity + Unit Cost in one row with live total ── */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <Label>Quantity &amp; Unit Cost</Label>
          {displayQty > 1 && (
            <span className="text-xs text-muted-foreground font-mono">
              Total: {formatCurrency(originalCostInCents, currentReceiptCurrency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Stepper — NaN-safe: always reads/writes through safeQuantity() */}
          <div className="flex items-center rounded-lg border bg-background">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-secondary/80 active:bg-secondary disabled:opacity-40 transition-colors"
              onClick={() => setQuantity(Math.max(1, displayQty - 1))}
              disabled={displayQty <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base font-semibold tabular-nums select-none">
              {displayQty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-secondary/80 active:bg-secondary transition-colors"
              onClick={() => setQuantity(displayQty + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <span className="text-muted-foreground shrink-0 text-sm">×</span>

          {/* Unit cost */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
              {currentReceiptCurrency}
            </span>
            <Input
              id="unitcost"
              type="text"
              inputMode="decimal"
              value={unitCostStr}
              onChange={(e) => {
                const v = e.target.value;
                if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(v) || v === '') {
                  setUnitCostStr(v);
                }
              }}
              onBlur={(e) => {
                const n = parseFloat(e.target.value);
                setUnitCostStr(isNaN(n) ? '0.00' : n.toFixed(2));
              }}
              className="h-11 pl-10 text-right text-base font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* ── Receipt ── */}
      <div className="space-y-1.5">
        <Label htmlFor="item-receipt">Receipt</Label>
        <ResponsiveSelect value={receiptId} onValueChange={setReceiptId}>
          <ResponsiveSelectTrigger
            id="item-receipt"
            disabled={receipts.length === 0}
            className="h-11 w-full"
          >
            {receipts.find((r) => r.id === receiptId)?.name ?? 'Select a receipt'}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            <ResponsiveSelectLabel>Select a Receipt</ResponsiveSelectLabel>
            {receipts.map((r) => (
              <ResponsiveSelectItem key={r.id} value={r.id}>
                {r.name}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>

      {/* ── Category — segmented button group ── */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-sm font-medium transition-all',
                category === value
                  ? 'bg-primary/15 text-primary shadow-[0_0_0_2px_rgba(168,85,247,0.4)]'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/70',
              )}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-category ── */}
      <div className="space-y-1.5">
        <Label htmlFor="sub-category">
          Sub-category{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="sub-category"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="h-11"
          placeholder="e.g. Pizza, Beer, Side dish"
        />
      </div>

      {/* ── Item discounts ── */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Item discounts</Label>
          {discounts.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              -{formatCurrency(
                discounts.reduce((s, d) => s + d.amount, 0),
                currentReceiptCurrency,
              )}
            </span>
          )}
        </div>

        {discounts.map((discount) => (
          <div
            key={discount.id}
            className="flex items-end gap-2 rounded-xl border bg-secondary/30 p-3"
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <Label
                htmlFor={`d-name-${discount.id}`}
                className="text-xs text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id={`d-name-${discount.id}`}
                placeholder="Discount name"
                value={discount.name}
                onChange={(e) =>
                  onDiscountNameChange(discount.id, e.target.value)
                }
                className="h-10"
              />
            </div>
            <div className="shrink-0 space-y-1.5">
              <Label
                htmlFor={`d-amt-${discount.id}`}
                className="text-xs text-muted-foreground"
              >
                Amount
              </Label>
              <Input
                id={`d-amt-${discount.id}`}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={discountAmountStrings[discount.id] ?? ''}
                onChange={(e) =>
                  onDiscountAmountStringChange(discount.id, e.target.value)
                }
                onBlur={() => onDiscountAmountBlur(discount.id)}
                className="h-10 w-24 text-right font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveDiscount(discount.id)}
              aria-label="Remove discount"
              className="mb-[1px] flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddDiscount}
          className="w-full h-10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add discount
        </Button>
      </div>
    </div>
  );
}

// ─── Footer content (shared) ──────────────────────────────────────────────────

interface FooterContentProps {
  item: Item;
  effectiveCost: number;
  currentReceiptCurrency: string;
  onDelete: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

function FooterContent({
  item, effectiveCost, currentReceiptCurrency, onDelete, onClose, isMobile
}: FooterContentProps) {
  return (
    <div className={cn(
      "flex gap-3",
      isMobile ? "flex-col" : "flex-col-reverse sm:flex-row sm:items-center sm:justify-between"
    )}>
      {/* Effective cost chip */}
      <div className={cn(
        "flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5",
        !isMobile && "sm:order-2"
      )}>
        <span className="text-sm text-muted-foreground">Effective cost</span>
        <span className="ml-6 font-bold text-lg tabular-nums">
          {formatCurrency(effectiveCost, currentReceiptCurrency)}
        </span>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex gap-2",
        isMobile ? "flex-col" : "sm:order-1 sm:flex-row sm:items-center"
      )}>
        <Button type="submit" className={cn("h-12 text-base font-semibold", isMobile ? "w-full" : "sm:h-10 sm:text-sm")}>
          Save changes
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-12 text-base bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
                isMobile ? "w-full" : "sm:h-10 sm:text-sm"
              )}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete item
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes this item. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ItemEditDialog({
  item,
  items,
  receipts,
  isOpen,
  onOpenChange,
  onSave,
  onDelete,
  pendingSuggestion,
}: ItemEditDialogProps) {
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const dispatch = useDispatch<AppDispatch>();

  // ── Local form state ────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [unitCostStr, setUnitCostStr] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [receiptId, setReceiptId] = useState('');
  const [category, setCategory] = useState<'Food' | 'Drink' | 'Other'>('Other');
  const [subCategory, setSubCategory] = useState('');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountAmountStrings, setDiscountAmountStrings] = useState<Record<string, string>>({});

  // ── iOS keyboard detection ──────────────────────────────────────────────────
  // Returns the keyboard height on iOS (where keyboard overlays rather than
  // resizes the viewport). Returns 0 on Android and desktop.
  const iosKeyboardInset = useIosKeyboardInset(!!isMobile && isOpen);

  // ── Populate form when item changes ────────────────────────────────────────
  useEffect(() => {
    if (item) {
      setName(item.name);

      // ── Quantity: sanitise before touching state ──
      // AI parsing or corrupt data can produce NaN/0/Infinity.
      // safeQuantity() clamps to a positive integer, defaulting to 1.
      const qty = safeQuantity(item.quantity);
      setQuantity(qty);

      // ── Unit cost: sanitise the derived string ──
      // item.unitCost is in cents (may be undefined/NaN).
      // Fallback: divide total cost by quantity — use the sanitised qty to
      // avoid 0/NaN division.
      let costStr = '0.00';
      if (item.unitCost != null && Number.isFinite(item.unitCost) && item.unitCost >= 0) {
        costStr = (item.unitCost / 100).toFixed(2);
      } else if (Number.isFinite(item.cost) && item.cost >= 0) {
        costStr = (item.cost / 100 / qty).toFixed(2);
      }
      setUnitCostStr(costStr);

      setReceiptId(item.receiptId);
      setCategory(item.category || 'Other');
      setSubCategory(item.subCategory || '');
      const cloned: Discount[] = JSON.parse(JSON.stringify(item.discounts || []));
      setDiscounts(cloned);
      const strings: Record<string, string> = {};
      cloned.forEach((d) => {
        strings[d.id] = (d.amount / 100).toFixed(2);
      });
      setDiscountAmountStrings(strings);
    }
  }, [item]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const currentReceipt = receipts.find((r) => r.id === receiptId);
  const currentReceiptCurrency = currentReceipt?.currency || 'USD';
  const unitCostInCents = Math.round(parseFloat(unitCostStr) * 100) || 0;
  // Use safeQuantity for all calculations so NaN can never propagate into math
  const safeQty = safeQuantity(quantity);
  const originalCostInCents = unitCostInCents * safeQty;
  const totalItemDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const effectiveCost = originalCostInCents - totalItemDiscounts;
  const isSuggestionConflict = !!(
    pendingSuggestion && item && pendingSuggestion.discount.amount > item.cost
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSaveAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (item && name.trim() && !isNaN(unitCostInCents) && receiptId) {
      onSave({
        id: item.id,
        name: name.trim(),
        cost: originalCostInCents,
        // Always write a sanitised quantity — prevents NaN from persisting
        // in the Redux store and corrupting future calculations.
        quantity: safeQty,
        unitCost: unitCostInCents,
        receiptId,
        discounts,
        category,
        subCategory: subCategory.trim(),
      });
      onOpenChange(false);
    }
  };

  const handleDeleteItem = () => {
    if (item) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const handleAddDiscount = () => {
    const nd: Discount = {
      id: `d_item_${item?.id}_${Date.now()}`,
      name: 'New Discount',
      amount: 0,
    };
    setDiscounts((prev) => [...prev, nd]);
    setDiscountAmountStrings((prev) => ({ ...prev, [nd.id]: '0.00' }));
  };

  const handleDiscountNameChange = (id: string, v: string) =>
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, name: v } : d)));

  const handleDiscountAmountStringChange = (id: string, v: string) => {
    if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(v) || v === '') {
      setDiscountAmountStrings((prev) => ({ ...prev, [id]: v }));
    }
  };

  const handleDiscountAmountBlur = (id: string) => {
    const cents = Math.round(parseFloat(discountAmountStrings[id] || '') * 100) || 0;
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, amount: cents } : d)));
    setDiscountAmountStrings((prev) => ({ ...prev, [id]: (cents / 100).toFixed(2) }));
  };

  const handleRemoveDiscount = (id: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    setDiscountAmountStrings((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const handleApplySuggestion = () => {
    if (pendingSuggestion) {
      dispatch(applySuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false);
    }
  };
  const handleIgnoreSuggestion = () => {
    if (pendingSuggestion) {
      dispatch(ignoreSuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false);
    }
  };
  const handleReassignSuggestion = (newTargetItemId: string) => {
    if (pendingSuggestion) {
      dispatch(reassignSuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id, newTargetItemId }));
      onOpenChange(false);
    }
  };
  const handleRemoveSuggestion = () => {
    if (pendingSuggestion) {
      dispatch(removeDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false);
    }
  };

  /**
   * When any input inside the form gains focus, wait for the keyboard
   * animation to finish (≈350ms) then scroll the element into view.
   *
   * This covers both iOS (where the keyboard overlays content) and Android
   * (where the viewport resizes and Radix's ScrollArea may not auto-scroll).
   */
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      setTimeout(() => {
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 350);
    }
  }, []);

  if (!item) return null;

  const formBodyProps: FormBodyProps = {
    item, items, receipts, pendingSuggestion,
    name, setName,
    unitCostStr, setUnitCostStr,
    quantity, setQuantity,
    receiptId, setReceiptId,
    category, setCategory,
    subCategory, setSubCategory,
    discounts, discountAmountStrings,
    onAddDiscount: handleAddDiscount,
    onDiscountNameChange: handleDiscountNameChange,
    onDiscountAmountStringChange: handleDiscountAmountStringChange,
    onDiscountAmountBlur: handleDiscountAmountBlur,
    onRemoveDiscount: handleRemoveDiscount,
    onApplySuggestion: handleApplySuggestion,
    onIgnoreSuggestion: handleIgnoreSuggestion,
    onReassignSuggestion: handleReassignSuggestion,
    onRemoveSuggestion: handleRemoveSuggestion,
    isSuggestionConflict,
    effectiveCost,
    originalCostInCents,
    currentReceiptCurrency,
  };

  // ── Mobile: vaul bottom-sheet ───────────────────────────────────────────────
  //
  // Key design decisions for keyboard compatibility:
  //
  // 1. `maxHeight: '92svh'` (small viewport height) instead of `92dvh`:
  //    svh is stable — it does NOT recalculate when the keyboard appears on
  //    Android (dvh does, causing the drawer to jank-resize mid-animation).
  //
  // 2. Footer buttons live INSIDE the ScrollArea (not in a separate sticky
  //    DrawerFooter). This fixes the iOS bug where a sticky footer sits behind
  //    the keyboard and becomes unreachable without dismissing it.
  //    With the footer in the scroll content, the user simply scrolls down
  //    to reach Save/Delete — and `iosKeyboardInset` adds exactly enough
  //    bottom padding so the buttons scroll above the keyboard.
  //
  // 3. `onFocusCapture` scrolls the focused input into view after the keyboard
  //    animation completes, covering cases where Radix's ScrollArea doesn't
  //    auto-scroll (common on older iOS Safari).
  //
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent
          className="flex flex-col"
          // svh: stable small-viewport height — unaffected by Android keyboard resize
          style={{ maxHeight: '92svh' }}
        >
          <DrawerHeader className="px-4 pt-4 pb-3 text-left shrink-0">
            <DrawerTitle className="text-xl font-headline">Edit item</DrawerTitle>
            <DrawerDescription className="text-sm">
              {item.name}
              {pendingSuggestion && (
                <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
                  <Sparkles className="h-3 w-3" /> AI suggestion
                </span>
              )}
            </DrawerDescription>
          </DrawerHeader>

          <form
            onSubmit={handleSaveAndClose}
            className="flex flex-col flex-1 min-h-0"
            onFocusCapture={handleFocusCapture}
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 pt-4">
                <FormBody {...formBodyProps} />
              </div>

              {/*
               * Footer is part of the scroll content — not a sticky overlay.
               * paddingBottom = iosKeyboardInset ensures these buttons can be
               * scrolled above the iOS software keyboard.
               * The extra 24px is standard spacing; env(safe-area-inset-bottom)
               * is handled by the base DrawerContent class.
               */}
              <div
                className="px-4 pt-5"
                style={{
                  paddingBottom: Math.max(iosKeyboardInset + 24, 24),
                }}
              >
                <FooterContent
                  item={item}
                  effectiveCost={effectiveCost}
                  currentReceiptCurrency={currentReceiptCurrency}
                  onDelete={handleDeleteItem}
                  onClose={() => onOpenChange(false)}
                  isMobile
                />
              </div>
            </ScrollArea>
          </form>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: centred dialog ─────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>
            Update the details for this item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveAndClose} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5">
              <FormBody {...formBodyProps} />
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4">
            <FooterContent
              item={item}
              effectiveCost={effectiveCost}
              currentReceiptCurrency={currentReceiptCurrency}
              onDelete={handleDeleteItem}
              onClose={() => onOpenChange(false)}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
