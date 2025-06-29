
"use client";

import React, { useState, useEffect } from 'react';
import { type Receipt, type Discount, type ServiceCharge } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { updateReceipt, updateServiceCharge, addDiscount, updateDiscount, removeDiscount, removeReceipt } from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import ReceiptImageViewer from './ReceiptImageViewer';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { cn } from '@/lib/utils';
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


export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  const isPayerMissing = !receipt.payerId;
  const [isCardOpen, setIsCardOpen] = useState(isPayerMissing);

  const discounts = receipt.discounts || [];
  const hasDiscountConfidence = discounts.some(d => d.confidence !== undefined);
  const hasServiceChargeConfidence = receipt.serviceCharge?.confidence !== undefined;

  const subtotal = items
    .filter(i => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + item.cost, 0);

  const totalDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const subtotalAfterDiscounts = subtotal - totalDiscounts;

  const serviceChargeAmount = receipt.serviceCharge?.type === 'fixed'
    ? receipt.serviceCharge.value
    : Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
  
  const receiptTotal = subtotalAfterDiscounts + serviceChargeAmount;

  const hasConflict = receiptTotal < 0;

  useEffect(() => {
    // This effect ensures that if the payer status changes to missing
    // (e.g., a participant is deleted), the card will open to prompt the user.
    if (isPayerMissing) {
      setIsCardOpen(true);
    }
  }, [isPayerMissing]);

  useEffect(() => {
    // Automatically expand the discounts section if there's a conflict
    if (hasConflict && isCardOpen) {
      setOpenAccordion('discounts');
    }
  }, [hasConflict, isCardOpen]);
  
  const handleRemoveReceipt = () => {
    dispatch(removeReceipt(receipt.id));
  };

  const handleUpdateReceipt = (updates: Partial<Receipt>) => {
    dispatch(updateReceipt({ id: receipt.id, ...updates }));
  };

  const handleUpdateServiceCharge = (updates: Partial<ServiceCharge>) => {
    dispatch(updateServiceCharge({ receiptId: receipt.id, serviceCharge: { ...receipt.serviceCharge, ...updates } as ServiceCharge }));
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    // Sanitize common symbols to ISO codes
    let sanitizedCode = currencyCode?.toUpperCase().trim() || 'USD'; // Default to USD if null/undefined
    if (sanitizedCode === '£' || sanitizedCode === 'POUND' || sanitizedCode === 'POUNDS' || sanitizedCode === 'STERLING') {
      sanitizedCode = 'GBP';
    } else if (sanitizedCode === '$' || sanitizedCode === 'DOLLAR' || sanitizedCode === 'DOLLARS') {
      sanitizedCode = 'USD';
    } else if (sanitizedCode === '€' || sanitizedCode === 'EURO' || sanitizedCode === 'EUROS') {
      sanitizedCode = 'EUR';
    }

    try {
      // Attempt to format with the sanitized code
      return (amount / 100).toLocaleString(undefined, { style: 'currency', currency: sanitizedCode });
    } catch (e) {
      // If it still fails, log the error and fallback to a default currency (e.g., USD)
      console.error(`Failed to format currency with code: '${currencyCode}' (Sanitized: '${sanitizedCode}'). Falling back to USD.`, e);
      return (amount / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    }
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
          isPayerMissing && !hasConflict && isCardOpen && 'border-primary'
        )}>
            <div className="flex items-start p-6">
                <CardHeader className="flex-1 p-0">
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-2">
                    <Input 
                      defaultValue={receipt.name}
                      onBlur={(e) => handleUpdateReceipt({ name: e.target.value })}
                      className="text-lg font-semibold border-0 shadow-none -ml-3 focus-visible:ring-1 focus-visible:ring-ring flex-1"
                      maxLength={50}
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
                      {receipt.status !== 'processing' && (
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
                    <CardDescription className='flex items-center gap-2 mt-1.5'>
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
                  {receipt.status === 'failed' && receipt.error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Scan Failed</AlertTitle>
                      <AlertDescription>
                        {receipt.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
                <CollapsibleTrigger className="flex-shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring -mr-2">
                    <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", isCardOpen && "rotate-180")} />
                    <span className='sr-only'>{isCardOpen ? "Collapse" : "Expand"}</span>
                </CollapsibleTrigger>
            </div>
          
            <CollapsibleContent>
              {hasConflict && receipt.status === 'processed' && (
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
              {receipt.status === 'processed' && (
                <>
                  <CardContent className="space-y-4">
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
                        <AccordionTrigger className='hover:no-underline'>
                          <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                  <span>Discounts ({formatCurrency(totalDiscounts, receipt.currency)})</span>
                                  {hasDiscountConfidence && (
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
                        <AccordionContent className="space-y-2 pt-2">
                          {discounts.map(discount => (
                            <div key={discount.id} className="flex items-center gap-2">
                              <Input 
                                placeholder="Discount name"
                                defaultValue={discount.name}
                                onBlur={(e) => handleDiscountChange(discount.id, { name: e.target.value })}
                                className="flex-1"
                              />
                              <Input 
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                defaultValue={(discount.amount / 100).toFixed(2)}
                                onBlur={(e) => handleDiscountChange(discount.id, { amount: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                                className="w-28 text-right"
                              />
                              <Button variant="ghost" size="icon" onClick={() => dispatch(removeDiscount({ receiptId: receipt.id, discountId: discount.id }))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
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
                          <div className="flex items-center gap-6">
                            <RadioGroup 
                              value={receipt.serviceCharge.type} 
                              onValueChange={(type: 'fixed' | 'percentage') => handleUpdateServiceCharge({ type, value: 0 })}
                              className="flex items-center gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id={`sc-type-percentage-${receipt.id}`} />
                                <Label htmlFor={`sc-type-percentage-${receipt.id}`}>Percentage (%)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id={`sc-type-fixed-${receipt.id}`} />
                                <Label htmlFor={`sc-type-fixed-${receipt.id}`}>Fixed ({receipt.currency})</Label>
                              </div>
                            </RadioGroup>
                            <Input
                              key={`${receipt.id}-${receipt.serviceCharge.type}`} // Force re-render on type change
                              type="text"
                              inputMode="decimal"
                              defaultValue={receipt.serviceCharge.type === 'fixed' ? (receipt.serviceCharge.value / 100).toFixed(2) : receipt.serviceCharge.value}
                              onBlur={(e) => handleUpdateServiceCharge({ 
                                value: receipt.serviceCharge.type === 'fixed' 
                                  ? Math.round(parseFloat(e.target.value) * 100) || 0
                                  : parseFloat(e.target.value) || 0
                              })}
                              className="w-28 text-right"
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
