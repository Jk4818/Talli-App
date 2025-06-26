
"use client";

import React from 'react';
import { Receipt, Discount, ServiceCharge } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { updateReceipt, updateServiceCharge, addDiscount, updateDiscount, removeDiscount } from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
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
    <Card className='bg-card/50'>
      <CardHeader>
        <Input 
            defaultValue={receipt.name}
            onBlur={(e) => handleUpdateReceipt({ name: e.target.value })}
            className="text-lg font-semibold border-0 shadow-none -ml-3 focus-visible:ring-1 focus-visible:ring-ring"
        />
        <CardDescription>
          Subtotal: {formatCurrency(subtotal, receipt.currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Payer</Label>
            <Select onValueChange={(payerId) => handleUpdateReceipt({ payerId })} value={receipt.payerId ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Select a payer" /></SelectTrigger>
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
    </Card>
  );
}
