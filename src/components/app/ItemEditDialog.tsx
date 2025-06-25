"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Separator } from '../ui/separator';
import { formatCurrency } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { applySuggestedDiscount, ignoreSuggestedDiscount, reassignSuggestedDiscount, removeDiscount } from '@/lib/redux/slices/sessionSlice';
import { Badge } from '../ui/badge';
import { DropDrawer, DropDrawerContent, DropDrawerItem, DropDrawerLabel, DropDrawerTrigger } from '../ui/dropdrawer';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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
  const [costStr, setCostStr] = useState('');
  const [unitCostStr, setUnitCostStr] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [receiptId, setReceiptId] = useState('');
  const [category, setCategory] = useState<'Food' | 'Drink' | 'Other'>('Other');
  const [subCategory, setSubCategory] = useState('');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountAmountStrings, setDiscountAmountStrings] = useState<Record<string, string>>({});
  const dispatch = useDispatch<AppDispatch>();

  const updateCosts = useCallback((source: 'total' | 'unit' | 'quantity', value: number) => {
    let newTotal = parseFloat(costStr) * 100 || 0;
    let newUnit = parseFloat(unitCostStr) * 100 || 0;
    let newQty = quantity;

    if (source === 'quantity') {
      newQty = value;
      if (newUnit > 0) {
        newTotal = newUnit * newQty;
      } else if (newTotal > 0 && newQty > 0) {
        newUnit = newTotal / newQty;
      }
    } else if (source === 'total') {
      newTotal = value;
      if (newQty > 0) {
        newUnit = newTotal / newQty;
      }
    } else if (source === 'unit') {
      newUnit = value;
      if (newQty > 0) {
        newTotal = newUnit * newQty;
      }
    }
    
    setCostStr((newTotal / 100).toFixed(2));
    setUnitCostStr((newUnit / 100).toFixed(2));
  }, [costStr, unitCostStr, quantity]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setCostStr((item.cost / 100).toFixed(2));
      setUnitCostStr(item.unitCost ? (item.unitCost / 100).toFixed(2) : '');
      setReceiptId(item.receiptId);
      setCategory(item.category || 'Other');
      setSubCategory(item.subCategory || '');
      const initialDiscounts = JSON.parse(JSON.stringify(item.discounts || []));
      setDiscounts(initialDiscounts);
      
      const initialAmountStrings: Record<string, string> = {};
      (initialDiscounts as Discount[]).forEach(d => {
        initialAmountStrings[d.id] = (d.amount / 100).toFixed(2);
      });
      setDiscountAmountStrings(initialAmountStrings);
    }
  }, [item]);

  const handleSaveAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    const costInCents = Math.round(parseFloat(costStr) * 100);
    const unitCostInCents = quantity > 0 ? Math.round(costInCents / quantity) : 0;
    if (item && name.trim() && !isNaN(costInCents) && receiptId) {
      onSave({ 
        id: item.id, 
        name: name.trim(), 
        cost: costInCents, 
        quantity,
        unitCost: unitCostInCents,
        receiptId, 
        discounts, 
        category, 
        subCategory: subCategory.trim() 
      });
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
  
  const originalCostInCents = Math.round(parseFloat(costStr) * 100) || 0;
  const totalItemDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const effectiveCost = originalCostInCents - totalItemDiscounts;
  const isSuggestionConflict = !!(pendingSuggestion && item && pendingSuggestion.discount.amount > item.cost);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details for this item. Click Save Changes or press Enter to confirm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveAndClose} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
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
                                  <Button size="sm" type="button" className="w-full" onClick={handleApplySuggestion} disabled={!!isSuggestionConflict}>
                                      <Check className="mr-1.5 h-4 w-4" /> Apply
                                  </Button>
                              </span>
                          </AccessibleTooltip>
                          <DropDrawer>
                              <DropDrawerTrigger asChild>
                                  <Button size="sm" type="button" variant="secondary" className="w-full">
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
                      <Button type="button" size="sm" variant="ghost" className="w-full" onClick={handleIgnoreSuggestion}>
                          <Layers className="mr-1.5 h-4 w-4" /> Convert to Receipt-Wide Discount
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="destructive" className="w-full">
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
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                          setQuantity(val);
                          updateCosts('quantity', val);
                      }
                    }}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unitcost" className="text-right">
                    Unit Cost
                  </Label>
                  <Input
                    id="unitcost"
                    type="text"
                    inputMode="decimal"
                    value={unitCostStr}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
                          setUnitCostStr(value);
                      }
                    }}
                    onBlur={(e) => updateCosts('unit', Math.round(parseFloat(e.target.value) * 100))}
                    className="col-span-3"
                    placeholder='Auto'
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">
                    Total Cost
                  </Label>
                  <Input
                    id="cost"
                    type="text"
                    inputMode="decimal"
                    value={costStr}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
                          setCostStr(value);
                      }
                    }}
                    onBlur={(e) => updateCosts('total', Math.round(parseFloat(e.target.value) * 100))}
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Category</Label>
                  <div className="col-span-3">
                    <RadioGroup
                      value={category}
                      onValueChange={(v: 'Food' | 'Drink' | 'Other') => setCategory(v)}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Food" id={`cat-food-${item.id}`} />
                        <Label htmlFor={`cat-food-${item.id}`} className="font-normal cursor-pointer">Food</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Drink" id={`cat-drink-${item.id}`} />
                        <Label htmlFor={`cat-drink-${item.id}`} className="font-normal cursor-pointer">Drink</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id={`cat-other-${item.id}`} />
                        <Label htmlFor={`cat-other-${item.id}`} className="font-normal cursor-pointer">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sub-category" className="text-right">
                    Sub-category
                  </Label>
                  <Input
                    id="sub-category"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. Pizza, Beer, Side"
                  />
                </div>
                <Separator />
                <div>
                  <Label>Item Discounts</Label>
                  <div className="mt-2 space-y-2">
                    {discounts.map(discount => (
                      <div key={discount.id} className="flex flex-col sm:flex-row items-start sm:items-end gap-2 rounded-md border p-3 bg-secondary/30">
                        <div className='space-y-1.5 flex-1 min-w-[100px]'>
                            <Label htmlFor={`item-discount-name-${discount.id}`} className="text-xs text-muted-foreground">Discount Name</Label>
                            <Input 
                                id={`item-discount-name-${discount.id}`}
                                placeholder="Discount name"
                                value={discount.name}
                                onChange={(e) => handleDiscountNameChange(discount.id, e.target.value)}
                            />
                        </div>
                        <div className="flex w-full items-end justify-between gap-2 sm:w-auto sm:justify-start">
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
                            <Button type="button" variant="ghost" size="icon" className="mb-[1px]" onClick={() => handleRemoveDiscount(discount.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDiscount} className="w-full">
                        <Plus className="h-4 w-4 mr-2"/> Add Item Discount
                      </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t flex-col-reverse sm:flex-row sm:justify-between gap-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full sm:w-auto sm:mr-auto">
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
            <div className="flex w-full flex-col-reverse gap-4 sm:w-auto sm:flex-row sm:items-center">
                <div className="flex items-center justify-between sm:justify-end gap-4">
                    <p className="text-sm text-muted-foreground">Effective Cost</p>
                    <p className="font-bold text-lg">{formatCurrency(effectiveCost, currentReceiptCurrency)}</p>
                </div>
                <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
