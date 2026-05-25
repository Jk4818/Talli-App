"use client";

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { type Receipt } from '@/lib/types';
import { updateReceipt, removeReceipt } from '@/lib/redux/slices/sessionSlice';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
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
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CNY', 'CHF', 'NZD'];

interface ReceiptDetailsSheetProps {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptDetailsSheet({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailsSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const globalCurrency = useSelector((state: RootState) => state.session.globalCurrency);

  const handleUpdate = (updates: Partial<Receipt>) => {
    dispatch(updateReceipt({ id: receipt.id, ...updates }));
  };

  const handleDelete = () => {
    dispatch(removeReceipt(receipt.id));
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col gap-5 px-4 pb-2">
      {/* Receipt name */}
      <div className="space-y-1.5">
        <Label htmlFor={`details-name-${receipt.id}`}>Receipt name</Label>
        <Input
          id={`details-name-${receipt.id}`}
          defaultValue={receipt.name}
          maxLength={50}
          onBlur={(e) => handleUpdate({ name: e.target.value })}
        />
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <Label>Currency</Label>
        <ResponsiveSelect
          value={receipt.currency}
          onValueChange={(currency) => handleUpdate({ currency })}
        >
          <ResponsiveSelectTrigger className="w-full">
            {receipt.currency}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            <ResponsiveSelectLabel>Select Currency</ResponsiveSelectLabel>
            {CURRENCIES.map((c) => (
              <ResponsiveSelectItem key={c} value={c}>
                {c}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>

      {/* Exchange rate — only when different from global */}
      {receipt.currency !== globalCurrency && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Exchange rate
            {!receipt.exchangeRate && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                · required
              </span>
            )}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">
              1 {receipt.currency} =
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={receipt.exchangeRate}
              onBlur={(e) =>
                handleUpdate({
                  exchangeRate: parseFloat(e.target.value) || undefined,
                })
              }
              className={cn(
                "max-w-[120px]",
                !receipt.exchangeRate && "ring-2 ring-amber-400 focus-visible:ring-amber-400"
              )}
            />
            <span className="text-sm text-muted-foreground shrink-0">{globalCurrency}</span>
          </div>
        </div>
      )}

      <Separator />

      {/* Delete receipt */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete receipt
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{receipt.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the receipt and all its associated items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Receipt details</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
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
          <DialogTitle>Receipt details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
