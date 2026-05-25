"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { type Receipt, type Discount, type ServiceCharge } from '@/lib/types';
import {
  updateServiceCharge,
  addDiscount,
  updateDiscount,
  removeDiscount,
} from '@/lib/redux/slices/sessionSlice';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '../ui/drawer';
import { ScrollArea } from '../ui/scroll-area';
import { useIosKeyboardInset } from '@/hooks/use-ios-keyboard-inset';
import { handleFocusCapture } from '@/lib/keyboard-utils';

interface BillAdjustmentsSheetProps {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ServiceChargeType = 'none' | 'fixed' | 'percentage';

export default function BillAdjustmentsSheet({
  receipt,
  open,
  onOpenChange,
}: BillAdjustmentsSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const items = useSelector((state: RootState) => state.session.items);

  // Track iOS keyboard height so the drawer can lift above it.
  // Gated on isMobile && open — zero overhead when closed or on desktop.
  const iosKeyboardInset = useIosKeyboardInset(!!isMobile && open);

  const discounts = receipt.discounts || [];

  // Determine current service charge type including 'none' state
  const [scType, setScType] = useState<ServiceChargeType>(() => {
    if (!receipt.serviceCharge || receipt.serviceCharge.value === 0) return 'none';
    return receipt.serviceCharge.type;
  });
  const [scValueStr, setScValueStr] = useState(() => {
    if (!receipt.serviceCharge || receipt.serviceCharge.value === 0) return '';
    if (receipt.serviceCharge.type === 'fixed') {
      return (receipt.serviceCharge.value / 100).toFixed(2);
    }
    return receipt.serviceCharge.value.toString();
  });

  // Sync when receipt changes
  useEffect(() => {
    if (!open) return;
    if (!receipt.serviceCharge || receipt.serviceCharge.value === 0) {
      setScType('none');
      setScValueStr('');
    } else {
      setScType(receipt.serviceCharge.type);
      setScValueStr(
        receipt.serviceCharge.type === 'fixed'
          ? (receipt.serviceCharge.value / 100).toFixed(2)
          : receipt.serviceCharge.value.toString()
      );
    }
  }, [open, receipt.serviceCharge]);

  const subtotal = items
    .filter((i) => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + item.cost, 0);

  const totalDiscounts = discounts
    .filter((d) => !d.suggestedItemId)
    .reduce((acc, d) => acc + d.amount, 0);

  const subtotalAfterDiscounts = subtotal - totalDiscounts;

  const scValueNum = parseFloat(scValueStr) || 0;
  const serviceChargeAmount =
    scType === 'none'
      ? 0
      : scType === 'fixed'
      ? Math.round(scValueNum * 100)
      : Math.round(subtotalAfterDiscounts * (scValueNum / 100));

  const effectiveTotal = subtotalAfterDiscounts + serviceChargeAmount;

  const handleScTypeChange = (type: ServiceChargeType) => {
    setScType(type);
    setScValueStr('');
    if (type === 'none') {
      dispatch(
        updateServiceCharge({
          receiptId: receipt.id,
          serviceCharge: { type: 'fixed', value: 0 },
        })
      );
    }
  };

  const handleScValueBlur = () => {
    if (scType === 'none') return;
    const value =
      scType === 'fixed'
        ? Math.round(scValueNum * 100) || 0
        : scValueNum || 0;
    dispatch(
      updateServiceCharge({
        receiptId: receipt.id,
        serviceCharge: { type: scType, value } as ServiceCharge,
      })
    );
  };

  const handleDiscountChange = (id: string, updates: Partial<Discount>) => {
    dispatch(updateDiscount({ receiptId: receipt.id, discount: { id, ...updates } }));
  };

  const handleAddDiscount = () => {
    dispatch(addDiscount({ receiptId: receipt.id }));
  };

  const handleRemoveDiscount = (id: string) => {
    dispatch(removeDiscount({ receiptId: receipt.id, discountId: id }));
  };

  // Only show non-suggested (manual) receipt-wide discounts
  const manualDiscounts = discounts.filter((d) => !d.suggestedItemId);

  const content = (
    <div className="flex flex-col gap-6 px-4 pb-2">
      {/* Service & Tips */}
      <div className="space-y-3">
        <p className="font-semibold text-base">Service &amp; Tips</p>
        <RadioGroup
          value={scType}
          onValueChange={(v) => handleScTypeChange(v as ServiceChargeType)}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="none" id={`sc-none-${receipt.id}`} />
            <Label htmlFor={`sc-none-${receipt.id}`} className="font-normal cursor-pointer">None</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="fixed" id={`sc-fixed-${receipt.id}`} />
            <Label htmlFor={`sc-fixed-${receipt.id}`} className="font-normal cursor-pointer">Fixed amount</Label>
            {scType === 'fixed' && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-sm text-muted-foreground">{receipt.currency}</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={scValueStr}
                  onChange={(e) => setScValueStr(e.target.value)}
                  onBlur={handleScValueBlur}
                  className="w-24 text-right"
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="percentage" id={`sc-pct-${receipt.id}`} />
              <Label htmlFor={`sc-pct-${receipt.id}`} className="font-normal cursor-pointer">Percentage</Label>
              {scType === 'percentage' && (
                <div className="flex items-center gap-1 ml-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={scValueStr}
                    onChange={(e) => setScValueStr(e.target.value)}
                    onBlur={handleScValueBlur}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
            {scType === 'percentage' && scValueNum > 0 && (
              <p className="text-xs text-muted-foreground ml-6">
                {scValueNum}% of {formatCurrency(subtotalAfterDiscounts, receipt.currency)} ={' '}
                {formatCurrency(serviceChargeAmount, receipt.currency)}
              </p>
            )}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Discounts */}
      <div className="space-y-3">
        <p className="font-semibold text-base">Discounts on this bill</p>
        {manualDiscounts.length === 0 && (
          <p className="text-sm text-muted-foreground">No discounts added yet.</p>
        )}
        {manualDiscounts.map((discount) => (
          <div key={discount.id} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                placeholder="e.g. Promo code"
                defaultValue={discount.name}
                onBlur={(e) => handleDiscountChange(discount.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1 w-28">
              <Label className="text-xs text-muted-foreground">Amount ({receipt.currency})</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={(discount.amount / 100).toFixed(2)}
                onBlur={(e) =>
                  handleDiscountChange(discount.id, {
                    amount: Math.round(parseFloat(e.target.value) * 100) || 0,
                  })
                }
                className="text-right"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="mb-[1px] flex-shrink-0"
              onClick={() => handleRemoveDiscount(discount.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleAddDiscount}>
          <Plus className="h-4 w-4 mr-1" />
          Add a discount
        </Button>
      </div>

      <Separator />

      {/* Effective total */}
      <div className="flex items-center justify-between font-semibold text-base">
        <span>Effective total</span>
        <span>{formatCurrency(effectiveTotal, receipt.currency)}</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {/*
          keyboardInset lifts the drawer above the iOS keyboard.
          Native overflow-y-auto (not Radix ScrollArea) is required so
          scrollIntoView can traverse the scroll boundary — Radix ScrollArea
          uses overflow:hidden on its root, which blocks the browser's
          scroll-into-view algorithm.
        */}
        <DrawerContent keyboardInset={iosKeyboardInset}>
          <DrawerHeader className="text-left">
            <DrawerTitle>Bill Adjustments</DrawerTitle>
          </DrawerHeader>
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: '60vh' }}
            onFocusCapture={handleFocusCapture}
          >
            {content}
          </div>
          <DrawerFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bill Adjustments</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
