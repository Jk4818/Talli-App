
"use client";

import React, { useState, useEffect } from 'react';
import { Item, Receipt, Discount } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { Trash2, Plus, Sparkles, Check, X, Pencil, Layers, AlertCircle } from 'lucide-react';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { formatCurrency } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { applySuggestedDiscount, ignoreSuggestedDiscount, reassignSuggestedDiscount, removeDiscount } from '@/lib/redux/slices/sessionSlice';
import { Badge } from '../ui/badge';
import { DropDrawer, DropDrawerContent, DropDrawerItem, DropDrawerLabel, DropDrawerTrigger } from '../ui/dropdrawer';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AccessibleTooltip } from '../ui/accessible-tooltip';


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

export default function ItemEditDialog({ item, items, receipts, isOpen, onOpenChange, onSave, onDelete, pendingSuggestion }: ItemEditDialogProps) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountAmountStrings, setDiscountAmountStrings] = useState<Record<string, string>>({});
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCost((item.cost / 100).toFixed(2));
      setReceiptId(item.receiptId);
      const initialDiscounts = JSON.parse(JSON.stringify(item.discounts || []));
      setDiscounts(initialDiscounts);
      
      const initialAmountStrings: Record<string, string> = {};
      (initialDiscounts as Discount[]).forEach(d => {
        initialAmountStrings[d.id] = (d.amount / 100).toFixed(2);
      });
      setDiscountAmountStrings(initialAmountStrings);
    }
  }, [item]);

  const handleSave = () => {
    const costInCents = Math.round(parseFloat(cost) * 100);
    if (item && name.trim() && !isNaN(costInCents) && receiptId) {
      onSave({ id: item.id, name: name.trim(), cost: costInCents, receiptId, discounts });
      onOpenChange(false);
    }
  };
  
  const handleDeleteItem = () => {
    if(item) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const handleAddDiscount = () => {
    const newDiscount = {
        id: `d_item_${item?.id}_${Date.now()}`,
        name: 'New Discount',
        amount: 0,
    };
    setDiscounts(prev => [...prev, newDiscount]);
    setDiscountAmountStrings(prev => ({
        ...prev,
        [newDiscount.id]: '0.00'
    }));
  };
  
  const handleDiscountNameChange = (id: string, value: string) => {
    setDiscounts(prev => prev.map(d => (d.id === id ? { ...d, name: value } : d)));
  };

  const handleDiscountAmountStringChange = (id: string, value: string) => {
    if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
      setDiscountAmountStrings(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleDiscountAmountBlur = (id: string) => {
    const valueStr = discountAmountStrings[id] || '';
    const amountInCents = valueStr ? Math.round(parseFloat(valueStr) * 100) : 0;
    setDiscounts(prev => prev.map(d => (d.id === id ? { ...d, amount: amountInCents } : d)));
    setDiscountAmountStrings(prev => ({ ...prev, [id]: (amountInCents / 100).toFixed(2) }));
  };


  const handleRemoveDiscount = (id: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== id));
    setDiscountAmountStrings(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
    });
  };
  
  const handleApplySuggestion = () => {
    if (pendingSuggestion) {
      dispatch(applySuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false); // Close dialog after action
    }
  };

  const handleIgnoreSuggestion = () => {
    if (pendingSuggestion) {
      dispatch(ignoreSuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false); // Close dialog after action
    }
  };

  const handleReassignSuggestion = (newTargetItemId: string) => {
    if (pendingSuggestion) {
      dispatch(reassignSuggestedDiscount({
        receiptId: pendingSuggestion.receiptId,
        discountId: pendingSuggestion.discount.id,
        newTargetItemId: newTargetItemId,
      }));
      onOpenChange(false); // Close dialog after action
    }
  };

  const handleRemoveSuggestion = () => {
    if (pendingSuggestion) {
      dispatch(removeDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
      onOpenChange(false);
    }
  };

  if (!item) return null;

  const currentReceipt = receipts.find(r => r.id === receiptId);
  const currentReceiptCurrency = currentReceipt?.currency || 'USD';
  
  const originalCostInCents = Math.round(parseFloat(cost) * 100) || 0;
  const totalItemDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const effectiveCost = originalCostInCents - totalItemDiscounts;
  const isSuggestionConflict = pendingSuggestion && item && pendingSuggestion.discount.amount > item.cost;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details for this item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-6 -mr-6">
          {pendingSuggestion && (
             <div className="mb-4 p-3 rounded-md bg-accent/30 border border-primary/20 space-y-3 text-sm">
                <div className="flex justify-between items-start">
                    <div className='flex items-center gap-2 font-semibold text-accent-foreground'>
                        <Sparkles className="h-4 w-4" />
                        AI Discount Suggestion
                    </div>
                    {pendingSuggestion.discount.confidence && <Badge variant="secondary" className="text-primary font-medium"><Sparkles className='h-3 w-3 mr-1.5' /> {pendingSuggestion.discount.confidence}%</Badge>}
                </div>

                {isSuggestionConflict && (
                    <Alert variant="destructive" className="my-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Potential Conflict</AlertTitle>
                        <AlertDescription>
                            Applying this discount would make the item cost negative. Please reassign or remove it.
                        </AlertDescription>
                    </Alert>
                )}

                <p>
                    AI suggests applying the <span className='font-medium'>&quot;{pendingSuggestion.discount.name}&quot;</span> discount (-{formatCurrency(pendingSuggestion.discount.amount, currentReceiptCurrency)}) to this item.
                </p>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <AccessibleTooltip content={isSuggestionConflict ? "Cannot apply discount greater than item cost." : "Apply this discount to the item"}>
                            <span className="w-full" tabIndex={0}>
                                <Button size="sm" className="w-full" onClick={handleApplySuggestion} disabled={isSuggestionConflict}>
                                    <Check className="mr-1.5 h-4 w-4" /> Apply
                                </Button>
                            </span>
                        </AccessibleTooltip>
                        <DropDrawer>
                            <DropDrawerTrigger asChild>
                                <Button size="sm" variant="secondary" className="w-full">
                                    <Pencil className="mr-1.5 h-4 w-4" /> Reassign
                                </Button>
                            </DropDrawerTrigger>
                            <DropDrawerContent>
                                <DropDrawerLabel>Reassign to another item</DropDrawerLabel>
                                {items.filter(i => i.receiptId === pendingSuggestion.receiptId && i.id !== item.id)
                                .map(otherItem => (
                                    <DropDrawerItem 
                                        key={otherItem.id}
                                        onClick={() => handleReassignSuggestion(otherItem.id)}
                                    >
                                        {otherItem.name}
                                    </DropDrawerItem>
                                ))}
                                {items.filter(i => i.receiptId === pendingSuggestion.receiptId && i.id !== item.id).length === 0 && (
                                  <DropDrawerItem disabled>No other items on this receipt</DropDrawerItem>
                                )}
                            </DropDrawerContent>
                        </DropDrawer>
                    </div>
                    <Button size="sm" variant="ghost" className="w-full" onClick={handleIgnoreSuggestion}>
                        <Layers className="mr-1.5 h-4 w-4" /> Convert to Receipt-Wide Discount
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="w-full">
                          <Trash2 className="h-4 w-4 mr-1.5" /> Remove Discount
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the AI-suggested &quot;{pendingSuggestion.discount.name}&quot; discount. This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRemoveSuggestion}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Original Cost
              </Label>
              <Input
                id="cost"
                type="text"
                inputMode="decimal"
                value={cost}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
                      setCost(value);
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receipt" className="text-right">
                Receipt
              </Label>
              <div className="col-span-3">
                <ResponsiveSelect value={receiptId} onValueChange={setReceiptId}>
                  <ResponsiveSelectTrigger id="receipt" disabled={receipts.length === 0} placeholder="Select a receipt">
                    {receipts.find((r) => r.id === receiptId)?.name}
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
            </div>
            <Separator />
            <div>
              <Label>Item Discounts</Label>
              <div className="mt-2 space-y-2">
                {discounts.map(discount => (
                  <div key={discount.id} className="flex flex-wrap items-end gap-2 rounded-md border p-3 bg-secondary/30">
                    <div className='space-y-1.5 flex-1 min-w-[150px]'>
                        <Label htmlFor={`item-discount-name-${discount.id}`} className="text-xs text-muted-foreground">Discount Name</Label>
                        <Input 
                            id={`item-discount-name-${discount.id}`}
                            placeholder="Discount name"
                            value={discount.name}
                            onChange={(e) => handleDiscountNameChange(discount.id, e.target.value)}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className='space-y-1.5'>
                            <Label htmlFor={`item-discount-amount-${discount.id}`} className="text-xs text-muted-foreground">Amount</Label>
                            <Input 
                                id={`item-discount-amount-${discount.id}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={discountAmountStrings[discount.id] ?? ''}
                                onChange={(e) => handleDiscountAmountStringChange(discount.id, e.target.value)}
                                onBlur={() => handleDiscountAmountBlur(discount.id)}
                                className="w-28 text-right"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="mb-[1px]" onClick={() => handleRemoveDiscount(discount.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))}
                 <Button variant="outline" size="sm" onClick={handleAddDiscount} className="w-full">
                    <Plus className="h-4 w-4 mr-2"/> Add Item Discount
                  </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2 border-t pt-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="sm:mr-auto mt-2 sm:mt-0 w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Item
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the item "{item?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Effective Cost</p>
                    <p className="font-bold text-lg">{formatCurrency(effectiveCost, currentReceiptCurrency)}</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
