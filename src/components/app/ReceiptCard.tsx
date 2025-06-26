
"use client";

import React, { useState } from 'react';
import { type Receipt, type Discount, type ServiceCharge } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { updateReceipt, updateServiceCharge, addDiscount, updateDiscount, removeDiscount, processReceipt } from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import ReceiptImageViewer from './ReceiptImageViewer';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';

export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const { user, isBetaUser } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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

  const handleScanReceipt = () => {
    if (receipt.imageDataUri && user) {
      dispatch(processReceipt({ 
        receiptId: receipt.id, 
        imageDataUri: receipt.imageDataUri,
        user: { email: user.email, email_verified: user.emailVerified }
      }));
    }
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

  return (
    <>
      <ReceiptImageViewer receipt={receipt} isOpen={isViewerOpen} onOpenChange={setIsViewerOpen} />
      <Card className='bg-card/50'>
        <CardHeader>
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center sm:items-start gap-2">
            <Input 
              defaultValue={receipt.name}
              onBlur={(e) => handleUpdateReceipt({ name: e.target.value })}
              className="text-lg font-semibold border-0 shadow-none -ml-3 focus-visible:ring-1 focus-visible:ring-ring flex-1"
            />
            <div className='flex items-center gap-2'>
              {receipt.imageDataUri && (
                <Button variant="outline" size="icon" onClick={() => setIsViewerOpen(true)}>
                    <ImageIcon className="h-5 w-5" />
                    <span className="sr-only">View Receipt Image</span>
                </Button>
              )}
              {receipt.status === 'unprocessed' && (
                isBetaUser ? (
                  <Button onClick={handleScanReceipt}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Scan with AI
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button disabled>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Scan with AI
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI scanning is available for beta users only. Please contact support to request access.</p>
                    </TooltipContent>
                  </Tooltip>
                )
              )}
              {receipt.status === 'processing' && (
                <Button disabled>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </Button>
              )}
              {receipt.status === 'failed' && (
                <Button variant="destructive" onClick={handleScanReceipt}>
                  <AlertCircle className="mr-2 h-4 w-4"/>
                  Retry Scan
                </Button>
              )}
            </div>
          </div>
          {receipt.status === 'processed' && (
            <CardDescription>
              Subtotal: {formatCurrency(subtotal, receipt.currency)}
            </CardDescription>
          )}
        </CardHeader>
        {receipt.status === 'processed' && (
          <>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`payer-${receipt.id}`} className="flex items-center gap-1.5 mb-1">
                      Payer
                      {!receipt.payerId && receipt.status === 'processed' && (
                          <Tooltip>
                              <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>This receipt needs a payer.</p>
                              </TooltipContent>
                          </Tooltip>
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

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="discounts">
                  <AccordionTrigger>Discounts ({formatCurrency(totalDiscounts, receipt.currency)})</AccordionTrigger>
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
                  <AccordionTrigger>Service Charge / Tip ({formatCurrency(serviceChargeAmount, receipt.currency)})</AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="flex items-center gap-6">
                      <RadioGroup 
                        value={serviceCharge.type} 
                        onValueChange={(type: 'fixed' | 'percentage') => handleUpdateServiceCharge({ type })}
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
                        type="number"
                        step="0.01"
                        defaultValue={serviceCharge.type === 'fixed' ? serviceCharge.value / 100 : serviceCharge.value}
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
