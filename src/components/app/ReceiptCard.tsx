"use client";

import React, { useState, useEffect } from 'react';
import { type Receipt, type Discount, type ServiceCharge } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { updateReceipt, updateServiceCharge, addDiscount, updateDiscount, removeDiscount, processReceipt, removeReceipt } from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import ReceiptImageViewer from './ReceiptImageViewer';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
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


export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  const serviceCharge = receipt.serviceCharge || { type: 'fixed', value: 0 };
  const discounts = receipt.discounts || [];

  const subtotal = items
    .filter(i => i.receiptId === receipt.id)
    .reduce((acc, item) => acc + item.cost, 0);

  const totalDiscounts = discounts.reduce((acc, d) => acc + d.amount, 0);
  const subtotalAfterDiscounts = subtotal - totalDiscounts;

  const serviceChargeAmount = serviceCharge.type === 'fixed'
    ? serviceCharge.value
    : Math.round(subtotalAfterDiscounts * (serviceCharge.value / 100));
  
  const receiptTotal = subtotalAfterDiscounts + serviceChargeAmount;

  const hasConflict = receiptTotal < 0;

  useEffect(() => {
    if (hasConflict) {
      setOpenAccordion('discounts');
    }
  }, [hasConflict]);

  const handleScanReceipt = () => {
    if (receipt.imageDataUri && user) {
      dispatch(processReceipt({ 
        receiptId: receipt.id, 
        imageDataUri: receipt.imageDataUri,
        user: { email: user.email, email_verified: user.emailVerified }
      }));
    }
  };
  
  const handleRemoveReceipt = () => {
    dispatch(removeReceipt(receipt.id));
  };

  const handleUpdateReceipt = (updates: Partial<Receipt>) => {
    dispatch(updateReceipt({ id: receipt.id, ...updates }));
  };

  const handleUpdateServiceCharge = (updates: Partial<ServiceCharge>) => {
    dispatch(updateServiceCharge({ receiptId: receipt.id, serviceCharge: { ...serviceCharge, ...updates } }));
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return (amount / 100).toLocaleString(undefined, { style: 'currency', currency: currencyCode });
  }
  
  const handleDiscountChange = (id: string, updates: Partial<Discount>) => {
    dispatch(updateDiscount({ receiptId: receipt.id, discount: { id, ...updates } }));
  }

  const serviceChargeDisplay =
    serviceCharge.type === 'percentage' && serviceCharge.value > 0
      ? `(${serviceCharge.value}% → ${formatCurrency(
          serviceChargeAmount,
          receipt.currency
        )})`
      : `(${formatCurrency(serviceChargeAmount, receipt.currency)})`;

  return (
    <>
      <ReceiptImageViewer receipt={receipt} isOpen={isViewerOpen} onOpenChange={setIsViewerOpen} />
      <Card className='bg-card/50'>
        <CardHeader>
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
              {receipt.status === 'unprocessed' && (
                  <Button onClick={handleScanReceipt} disabled={!user}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Scan with AI
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
            <CardDescription className='flex items-center gap-2'>
              <span>Subtotal: {formatCurrency(subtotal, receipt.currency)}</span>
              {receipt.overallConfidence !== undefined && (
                <AccessibleTooltip content={<p>The AI was {receipt.overallConfidence}% confident in its analysis of this receipt.</p>}>
                  <span className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium'>
                    <Sparkles className='h-3.5 w-3.5 text-primary' />
                    <span>AI Confidence: {receipt.overallConfidence}%</span>
                  </span>
                </AccessibleTooltip>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`payer-${receipt.id}`} className="flex items-center gap-1.5 mb-1">
                      Payer
                      {!receipt.payerId && receipt.status === 'processed' && (
                          <AccessibleTooltip content={<p>This receipt needs a payer.</p>}>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                          </AccessibleTooltip>
                      )}
                  </Label>
                  <Select onValueChange={(payerId) => handleUpdateReceipt({ payerId })} value={receipt.payerId ?? undefined}>
                    <SelectTrigger 
                      id={`payer-${receipt.id}`}
                      className={cn(!receipt.payerId && receipt.status === 'processed' && "ring-2 ring-offset-2 ring-destructive focus:ring-destructive")}
                    >
                      <SelectValue placeholder="Select a payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select onValueChange={(currency) => handleUpdateReceipt({ currency })} value={receipt.currency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="NZD">NZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {receipt.currency !== globalCurrency && (
                <div className="space-y-2">
                  <Label>Exchange Rate to {globalCurrency}</Label>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>1 {receipt.currency} =</span>
                    <Input 
                      type="number"
                      placeholder='e.g. 1.25'
                      step="0.0001"
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
                  <AccordionTrigger className='justify-between hover:no-underline'>
                      <div className="flex items-center gap-2">
                        {receipt.discounts && receipt.discounts.length > 0 && <Sparkles className="h-4 w-4 text-primary" />}
                        <span>Discounts ({formatCurrency(totalDiscounts, receipt.currency)})</span>
                      </div>
                      {receipt.discounts && receipt.discounts.some(d => d.confidence !== undefined) && (
                        <AccessibleTooltip content={
                            <div className="p-1 space-y-1 text-xs">
                                <p className="font-bold mb-1">AI Confidence Scores</p>
                                {receipt.discounts.map(d => (
                                    d.confidence !== undefined && <div key={d.id} className="flex justify-between gap-4"><span>{d.name}:</span><span>{d.confidence}%</span></div>
                                ))}
                            </div>
                        }>
                            <div role="button" aria-label="View confidence scores" className="p-1 -mr-1 rounded-full hover:bg-muted-foreground/10" onClick={(e) => e.stopPropagation()}>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </AccessibleTooltip>
                      )}
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
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          defaultValue={discount.amount / 100}
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
                    <AccordionTrigger className='justify-between hover:no-underline'>
                        <div className="flex items-center gap-2">
                            {serviceCharge.value > 0 && <Sparkles className="h-4 w-4 text-primary" />}
                            <span>Service Charge / Tip {serviceChargeDisplay}</span>
                        </div>
                        {serviceCharge.confidence !== undefined && (
                            <AccessibleTooltip content={
                                <div className="p-1 space-y-1 text-xs">
                                    <p className="font-bold mb-1">AI Confidence Score</p>
                                    <div className="flex justify-between gap-4"><span>Service Charge:</span><span>{serviceCharge.confidence}%</span></div>
                                </div>
                            }>
                                <div role="button" aria-label="View confidence score" className="p-1 -mr-1 rounded-full hover:bg-muted-foreground/10" onClick={(e) => e.stopPropagation()}>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </AccessibleTooltip>
                        )}
                    </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="flex items-center gap-6">
                      <RadioGroup 
                        value={serviceCharge.type} 
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
                        key={`${receipt.id}-${serviceCharge.type}`} // Force re-render on type change
                        type="number"
                        step="0.01"
                        defaultValue={serviceCharge.type === 'fixed' ? (serviceCharge.value / 100).toFixed(2) : serviceCharge.value}
                        onBlur={(e) => handleUpdateServiceCharge({ 
                          value: serviceCharge.type === 'fixed' 
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
      </Card>
    </>
  );
}
