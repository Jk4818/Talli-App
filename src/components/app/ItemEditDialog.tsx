"use client";

import React, { useState, useEffect } from 'react';
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
  DrawerFooter,
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
  return (
    <div className="space-y-5">

      {/* ── AI Suggestion panel ── */}
      {pendingSuggestion && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
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
          {quantity > 1 && (
            <span className="text-xs text-muted-foreground font-mono">
              Total: {formatCurrency(originalCostInCents, currentReceiptCurrency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Stepper */}
          <div className="flex items-center rounded-lg border bg-background">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-secondary/80 active:bg-secondary disabled:opacity-40 transition-colors"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base font-semibold tabular-nums select-none">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-secondary/80 active:bg-secondary transition-colors"
              onClick={() => setQuantity(quantity + 1)}
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
                'flex flex-col items-center justify-center gap-1 rounded-xl border py-3 text-sm font-medium transition-all',
                category === value
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60',
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
          className="w-full h-10 border-dashed"
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
                "h-12 text-base border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
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

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setUnitCostStr(
        item.unitCost
          ? (item.unitCost / 100).toFixed(2)
          : (item.cost / 100 / item.quantity).toFixed(2),
      );
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
  const originalCostInCents = unitCostInCents * quantity;
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
        quantity,
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
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh] flex flex-col">
          <DrawerHeader className="px-4 pt-4 pb-3 text-left border-b">
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

          <form onSubmit={handleSaveAndClose} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-4">
                <FormBody {...formBodyProps} />
                {/* bottom padding so last field clears the footer */}
                <div className="h-4" />
              </div>
            </ScrollArea>

            <DrawerFooter className="border-t px-4 py-4 bg-background">
              <FooterContent
                item={item}
                effectiveCost={effectiveCost}
                currentReceiptCurrency={currentReceiptCurrency}
                onDelete={handleDeleteItem}
                onClose={() => onOpenChange(false)}
                isMobile
              />
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: centred dialog ─────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
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

          <DialogFooter className="px-6 py-4 border-t">
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
