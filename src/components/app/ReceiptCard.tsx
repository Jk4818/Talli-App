
"use client";

import React, { useState, useEffect } from 'react';
import { type Receipt, type Discount, type ServiceCharge } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { updateReceipt, updateServiceCharge, addDiscount, updateDiscount, removeDiscount, removeReceipt, applySuggestedDiscount, ignoreSuggestedDiscount, reassignSuggestedDiscount } from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, ChevronDown, Check, Pencil, Layers, FileWarning, MoreHorizontal } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import ReceiptImageViewer from './ReceiptImageViewer';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
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
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { Badge } from '../ui/badge';
import { DropDrawer, DropDrawerContent, DropDrawerItem, DropDrawerLabel, DropDrawerSub, DropDrawerSubContent, DropDrawerSubTrigger, DropDrawerTrigger } from '../ui/dropdrawer';

const getFriendlyErrorMessage = (error?: string | null): string => {
    if (!error) {
        return "An unknown error occurred during processing. Please try again.";
    }
    if (error.includes('does not appear to be a receipt')) {
        return "Our AI is pretty smart, but it's sure this isn't a receipt. Please try uploading a bill.";
    }
    if (error.includes('unclear to read') || error.includes('blurry')) {
        return "This receipt is playing hard to get. Could you try a clearer, brighter photo?";
    }
    if (error.includes('AI service failed')) {
        return "Our robot assistant seems to be on a coffee break. Please try again in a moment.";
    }
    return "Something went wrong during the scan. Please delete this attempt and try again.";
};


export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  const discounts = receipt.discounts || [];
  const hasSuggestions = discounts.some(d => d.suggestedItemId);
  const isPayerMissing = !receipt.payerId;
  const [isCardOpen, setIsCardOpen] = useState(isPayerMissing || hasSuggestions || receipt.status === 'failed');
  
  const hasDiscountConfidence = discounts.some(d => d.confidence !== undefined);
  const hasServiceChargeConfidence = receipt.serviceCharge?.confidence !== undefined;
  const hasMediumConfidence = receipt.overallConfidence !== undefined && receipt.overallConfidence < 85;

  const subtotal = items
    .filter(i => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + item.cost, 0);

  const totalReceiptDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const subtotalAfterDiscounts = subtotal - totalReceiptDiscounts;

  const serviceChargeAmount = receipt.serviceCharge?.type === 'fixed'
    ? receipt.serviceCharge.value
    : Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
  
  const totalItemLevelDiscounts = items
    .filter(i => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + (item.discounts || []).reduce((s,d) => s + d.amount, 0), 0);
  
  const receiptTotal = subtotalAfterDiscounts - totalItemLevelDiscounts + serviceChargeAmount;

  const hasConflict = receiptTotal < 0;

  useEffect(() => {
    // This effect ensures that if the payer status changes to missing
    // or new suggestions appear, the card will open to prompt the user.
    if (isPayerMissing || hasSuggestions || receipt.status === 'failed') {
      setIsCardOpen(true);
    }
  }, [isPayerMissing, hasSuggestions, receipt.status]);

  useEffect(() => {
    // Automatically expand the discounts section if there's a conflict or suggestions
    if ((hasConflict || hasSuggestions) && isCardOpen) {
      setOpenAccordion('discounts');
    }
  }, [hasConflict, hasSuggestions, isCardOpen]);
  
  const handleRemoveReceipt = () => {
    dispatch(removeReceipt(receipt.id));
  };

  const handleUpdateReceipt = (updates: Partial<Receipt>) => {
    dispatch(updateReceipt({ id: receipt.id, ...updates }));
  };

  const handleUpdateServiceCharge = (updates: Partial<ServiceCharge>) => {
    dispatch(updateServiceCharge({ receiptId: receipt.id, serviceCharge: { ...receipt.serviceCharge, ...updates } as ServiceCharge }));
  };
  
  const handleDiscountChange = (id: string, updates: Partial<Discount>) => {
    dispatch(updateDiscount({ receiptId: receipt.id, discount: { id, ...updates } }));
  }

  const serviceChargeDisplay =
    receipt.serviceCharge?.type === 'percentage' && receipt.serviceCharge.value > 0
      ? `(${receipt.serviceCharge.value}% → ${formatCurrency(
          serviceChargeAmount,
          receipt.currency
        )})`
      : `(${formatCurrency(serviceChargeAmount, receipt.currency)})`;

  return (
    <>
      <ReceiptImageViewer receipt={receipt} isOpen={isViewerOpen} onOpenChange={setIsViewerOpen} />
      <Collapsible open={isCardOpen} onOpenChange={setIsCardOpen}>
        <Card className={cn(
          'bg-card/50 overflow-hidden', 
          hasConflict && 'border-destructive',
          isPayerMissing && !hasConflict && isCardOpen && 'border-primary',
          receipt.status === 'failed' && 'border-destructive bg-destructive/10',
          !isCardOpen && hasSuggestions && 'ring-2 ring-red-400/30'
        )}>
            <div className="flex items-start p-6">
                <CardHeader className="flex-1 p-0">
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-2">
                    <Input 
                      defaultValue={receipt.name}
                      onBlur={(e) => handleUpdateReceipt({ name: e.target.value })}
                      className="text-lg font-semibold border-0 shadow-none -ml-3 focus-visible:ring-1 focus-visible:ring-ring flex-1"
                      maxLength={50}
                      disabled={receipt.status !== 'processed'}
                    />
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      {receipt.imageDataUri && (
                        <Button variant="outline" size="icon" onClick={() => setIsViewerOpen(true)}>
                            <ImageIcon className="h-5 w-5" />
                            <span className="sr-only">View Receipt Image</span>
                        </Button>
                      )}
                      {receipt.status === 'processing' && (
                        <Button disabled>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </Button>
                      )}
                      {receipt.status === 'processed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Remove Receipt</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will permanently delete the receipt "{receipt.name}" and all of its associated items. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRemoveReceipt}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                   {receipt.status === 'processed' && (
                    <CardDescription className='flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5'>
                      {!isCardOpen && hasConflict ? (
                        <div className="text-destructive font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Receipt conflict - expand to resolve</span>
                        </div>
                      ) : !isCardOpen && isPayerMissing ? (
                         <div className="text-primary font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Payer needed - expand to assign</span>
                        </div>
                      ) : !isCardOpen && hasSuggestions ? (
                        <Badge variant="outline" className="border-primary/50 text-primary font-medium">
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            AI Suggestions Pending
                        </Badge>
                      ) : (
                        <>
                          <span>Subtotal: {formatCurrency(subtotal, receipt.currency)}</span>
                          {receipt.overallConfidence !== undefined && (
                            <AccessibleTooltip content={<p>The AI was {receipt.overallConfidence}% confident in its analysis of this receipt.</p>}>
                              <span className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium'>
                                <Sparkles className='h-3.5 w-3.5 text-primary' />
                                <span>AI Confidence: {receipt.overallConfidence}%</span>
                              </span>
                            </AccessibleTooltip>
                          )}
                        </>
                      )}
                    </CardDescription>
                  )}
                </CardHeader>
                <CollapsibleTrigger className="flex-shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring -mr-2">
                    <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", isCardOpen && "rotate-180")} />
                    <span className='sr-only'>{isCardOpen ? "Collapse" : "Expand"}</span>
                </CollapsibleTrigger>
            </div>
          
            <CollapsibleContent>
              {receipt.status === 'failed' ? (
                <div className="p-6 pt-0 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <FileWarning className="h-8 w-8 text-destructive" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-destructive">Scan Unsuccessful</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
                        {getFriendlyErrorMessage(receipt.error)}
                    </p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Attempt
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will permanently delete this failed receipt attempt. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemoveReceipt}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              ) : (
                <>
                  {hasConflict && (
                      <div className='px-6 pb-6'>
                          <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Receipt Conflict</AlertTitle>
                              <AlertDescription>
                                  This receipt's total is negative. Please adjust the values in the expanded "Discounts" section below, or correct the item costs in the list at the bottom of the page.
                              </AlertDescription>
                          </Alert>
                      </div>
                  )}
                  <CardContent className="space-y-4">
                    {hasMediumConfidence && (
                        <Alert variant="default" className="border-primary/50 text-primary-foreground [&>svg]:text-primary">
                          <Sparkles className="h-4 w-4" />
                          <AlertTitle>AI Confidence is Moderate</AlertTitle>
                          <AlertDescription>
                            The AI was about {receipt.overallConfidence}% confident in this scan. Please review the items and totals carefully for any errors.
                          </AlertDescription>
                        </Alert>
                    )}
                     <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor={`payer-${receipt.id}`} className="flex items-center gap-1.5 text-sm font-medium">
                                Payer
                                {isPayerMissing && (
                                    <AccessibleTooltip content={<p>A payer must be assigned to this receipt.</p>}>
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                    </AccessibleTooltip>
                                )}
                            </Label>
                            <ResponsiveSelect onValueChange={(payerId) => handleUpdateReceipt({ payerId })} value={receipt.payerId ?? undefined}>
                              <ResponsiveSelectTrigger
                                id={`payer-${receipt.id}`}
                                className={cn(
                                  "w-full",
                                  isPayerMissing && "ring-2 ring-offset-2 ring-destructive focus:ring-destructive"
                                )}
                                disabled={participants.length === 0}
                              >
                                {receipt.payerId ? (
                                  participants.find((p) => p.id === receipt.payerId)?.name
                                ) : (
                                  <span className="text-muted-foreground">
                                    {participants.length > 0 ? "Select a payer" : "Add participants first"}
                                  </span>
                                )}
                              </ResponsiveSelectTrigger>
                              <ResponsiveSelectContent>
                                <ResponsiveSelectLabel>Select a Payer</ResponsiveSelectLabel>
                                {participants.map((p) => (
                                  <ResponsiveSelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </ResponsiveSelectItem>
                                ))}
                              </ResponsiveSelectContent>
                            </ResponsiveSelect>
                        </div>
                        <div className="w-full sm:w-auto space-y-1.5">
                            <Label>Currency</Label>
                             <ResponsiveSelect onValueChange={(currency) => handleUpdateReceipt({ currency })} value={receipt.currency}>
                              <ResponsiveSelectTrigger className="w-full sm:w-[120px]">
                                {receipt.currency}
                              </ResponsiveSelectTrigger>
                              <ResponsiveSelectContent>
                                <ResponsiveSelectLabel>Select Currency</ResponsiveSelectLabel>
                                <ResponsiveSelectItem value="USD">USD</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="EUR">EUR</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="GBP">GBP</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="CAD">CAD</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="AUD">AUD</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="JPY">JPY</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="INR">INR</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="CNY">CNY</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="CHF">CHF</ResponsiveSelectItem>
                                <ResponsiveSelectItem value="NZD">NZD</ResponsiveSelectItem>
                              </ResponsiveSelectContent>
                            </ResponsiveSelect>
                        </div>
                    </div>
                    
                    {receipt.currency !== globalCurrency && (
                      <div className="space-y-2">
                        <Label>Exchange Rate to {globalCurrency}</Label>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>1 {receipt.currency} =</span>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            placeholder='e.g. 1.25'
                            defaultValue={receipt.exchangeRate}
                            onBlur={(e) => handleUpdateReceipt({ exchangeRate: parseFloat(e.target.value) || undefined })}
                            className='max-w-[120px]'
                          />
                          <span className='text-sm text-muted-foreground'>{globalCurrency}</span>
                        </div>
                      </div>
                    )}

                    <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                      <AccordionItem value="discounts">
                        <AccordionTrigger className={cn(
                          'hover:no-underline rounded-md -mx-3 px-3',
                          hasSuggestions && 'ring-2 ring-red-400/30 data-[state=open]:ring-0'
                        )}>
                          <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                  <span>Receipt-Wide Discounts ({formatCurrency(totalReceiptDiscounts, receipt.currency)})</span>
                                  {hasSuggestions && <Sparkles className="h-4 w-4 text-primary" />}
                                  {hasDiscountConfidence && !hasSuggestions && (
                                      <AccessibleTooltip content={
                                        <div className="p-1 space-y-1 text-xs max-w-xs">
                                            <p className="font-bold mb-1">AI Confidence Scores</p>
                                            {discounts.filter(d => d.confidence !== undefined).map(d => (
                                                <div key={d.id} className="flex justify-between gap-4">
                                                    <span className="truncate pr-2">{d.name}:</span>
                                                    <span className="flex-shrink-0">{d.confidence}%</span>
                                                </div>
                                            ))}
                                        </div>
                                      }>
                                        <Sparkles
                                            className="h-4 w-4 text-primary"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        />
                                      </AccessibleTooltip>
                                  )}
                              </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2 px-1">
                          {discounts.map(discount => {
                            const suggestedItem = discount.suggestedItemId ? items.find(i => i.id === discount.suggestedItemId) : null;
    
                            if (suggestedItem) {
                              const isConflict = discount.amount > suggestedItem.cost;
                              return (
                                <div key={discount.id} className="p-3 rounded-md ring-2 ring-red-400/30 space-y-3">
                                  {isConflict && (
                                    <Alert variant="destructive" className="my-2">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>Potential Conflict</AlertTitle>
                                      <AlertDescription>
                                        Applying this discount would make the item cost negative.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                      <div className='flex items-center gap-2 font-semibold text-primary'>
                                          <Sparkles className="h-4 w-4" />
                                          AI Suggestion
                                      </div>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        Apply <span className="font-medium text-foreground">{discount.name}</span> (-{formatCurrency(discount.amount, receipt.currency)}) to <span className="font-medium text-foreground">{suggestedItem.name}</span>?
                                      </p>
                                    </div>
                                    {discount.confidence && <Badge variant="secondary" className="text-primary font-medium shrink-0"><Sparkles className='h-3 w-3 mr-1.5' /> {discount.confidence}%</Badge>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <AccessibleTooltip content={isConflict ? "Cannot apply: discount exceeds item cost." : "Apply this discount to the item"}>
                                        <span className="w-full" tabIndex={0}>
                                          <Button size="sm" className="w-full" onClick={() => dispatch(applySuggestedDiscount({ receiptId: receipt.id, discountId: discount.id }))} disabled={isConflict}>
                                            <Check className="mr-1.5 h-4 w-4" /> Apply
                                          </Button>
                                        </span>
                                      </AccessibleTooltip>
                                      <DropDrawer>
                                        <DropDrawerTrigger asChild>
                                            <Button size="sm" variant="outline" className="w-full">
                                                <MoreHorizontal className="h-4 w-4" /> More Options
                                            </Button>
                                        </DropDrawerTrigger>
                                        <DropDrawerContent>
                                            <DropDrawerLabel>More Options for "{discount.name}"</DropDrawerLabel>
                                            <DropDrawerSub>
                                                <DropDrawerSubTrigger icon={<Pencil className="h-4 w-4" />}>Reassign...</DropDrawerSubTrigger>
                                                <DropDrawerSubContent>
                                                    <DropDrawerLabel>Reassign to another item</DropDrawerLabel>
                                                    {items.filter(i => i.receiptId === receipt.id).map(item => (
                                                        <DropDrawerItem 
                                                            key={item.id}
                                                            onClick={() => dispatch(reassignSuggestedDiscount({ receiptId: receipt.id, discountId: discount.id, newTargetItemId: item.id }))}
                                                        >
                                                            {item.name}
                                                        </DropDrawerItem>
                                                    ))}
                                                </DropDrawerSubContent>
                                            </DropDrawerSub>
                                            <DropDrawerItem onClick={() => dispatch(ignoreSuggestedDiscount({ receiptId: receipt.id, discountId: discount.id }))} icon={<Layers className="h-4 w-4" />}>
                                                Make Receipt-Wide
                                            </DropDrawerItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropDrawerItem
                                                        onSelect={(e) => e.preventDefault()}
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        icon={<Trash2 className="h-4 w-4"/>}
                                                    >
                                                        Remove Discount
                                                    </DropDrawerItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This will permanently remove the AI-suggested &quot;{discount.name}&quot; discount. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => dispatch(removeDiscount({ receiptId: receipt.id, discountId: discount.id }))}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropDrawerContent>
                                    </DropDrawer>
                                  </div>
                                </div>
                              )
                            } else {
                              return (
                                <div key={discount.id} className="flex flex-wrap items-end gap-2 rounded-md border p-3 bg-secondary/30">
                                  <div className='space-y-1.5 flex-1 min-w-[150px]'>
                                      <Label htmlFor={`receipt-discount-name-${discount.id}`} className="text-xs text-muted-foreground">Discount Name</Label>
                                      <Input
                                          id={`receipt-discount-name-${discount.id}`}
                                          placeholder="e.g. 20% Off"
                                          defaultValue={discount.name}
                                          onBlur={(e) => handleDiscountChange(discount.id, { name: e.target.value })}
                                      />
                                  </div>
                                  <div className="flex w-full items-end justify-between gap-2 sm:w-auto sm:justify-start">
                                      <div className='space-y-1.5'>
                                          <Label htmlFor={`receipt-discount-amount-${discount.id}`} className="text-xs text-muted-foreground">Amount ({receipt.currency})</Label>
                                          <Input
                                              id={`receipt-discount-amount-${discount.id}`}
                                              type="text"
                                              inputMode="decimal"
                                              placeholder="0.00"
                                              defaultValue={(discount.amount / 100).toFixed(2)}
                                              onBlur={(e) => handleDiscountChange(discount.id, { amount: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                                              className="w-28 text-right"
                                          />
                                      </div>
                                      <Button variant="ghost" size="icon" className="mb-[1px]" onClick={() => dispatch(removeDiscount({ receiptId: receipt.id, discountId: discount.id }))}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </div>
                              )
                            }
                          })}
                          <Button variant="outline" size="sm" onClick={() => dispatch(addDiscount({ receiptId: receipt.id }))}>
                            <Plus className="h-4 w-4 mr-2"/> Add Discount
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="service-charge">
                          <AccordionTrigger className='hover:no-underline'>
                              <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                      <span>Service Charge / Tip {serviceChargeDisplay}</span>
                                      {hasServiceChargeConfidence && (
                                          <AccessibleTooltip content={<p className="text-xs">AI Confidence: {receipt.serviceCharge.confidence}%</p>}>
                                              <Sparkles
                                                className="h-4 w-4 text-primary"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                              />
                                          </AccessibleTooltip>
                                      )}
                                  </div>
                              </div>
                          </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <RadioGroup
                              value={receipt.serviceCharge.type}
                              onValueChange={(type: 'fixed' | 'percentage') => handleUpdateServiceCharge({ type, value: 0 })}
                              className="flex items-center gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id={`sc-type-percentage-${receipt.id}`} />
                                <Label htmlFor={`sc-type-percentage-${receipt.id}`} className="font-normal cursor-pointer">Percentage (%)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id={`sc-type-fixed-${receipt.id}`} />
                                <Label htmlFor={`sc-type-fixed-${receipt.id}`} className="font-normal cursor-pointer">Fixed ({receipt.currency})</Label>
                              </div>
                            </RadioGroup>
                            <Input
                              key={`${receipt.id}-${receipt.serviceCharge.type}`}
                              type="text"
                              inputMode="decimal"
                              defaultValue={receipt.serviceCharge.type === 'fixed' ? (receipt.serviceCharge.value / 100).toFixed(2) : receipt.serviceCharge.value.toString()}
                              onBlur={(e) => handleUpdateServiceCharge({
                                value: receipt.serviceCharge.type === 'fixed'
                                  ? Math.round(parseFloat(e.target.value) * 100) || 0
                                  : parseFloat(e.target.value) || 0
                              })}
                              className="w-full sm:w-32 text-right"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full text-right font-bold text-lg">
                      Receipt Total: {formatCurrency(receiptTotal, receipt.currency)}
                    </div>
                  </CardFooter>
                </>
              )}
            </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}

    