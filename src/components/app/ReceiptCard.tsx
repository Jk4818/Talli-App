"use client";

import React from 'react';
import { Receipt } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { updateReceipt } from '@/lib/redux/slices/sessionSlice';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

export default function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { participants, items } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const receiptItems = items.filter(i => i.receiptId === receipt.id);
  const subtotal = receiptItems.reduce((acc, item) => acc + item.cost, 0);

  const handlePayerChange = (payerId: string) => {
    dispatch(updateReceipt({ id: receipt.id, payerId }));
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateReceipt({ id: receipt.id, name: e.target.value }));
  };

  return (
    <Card>
      <CardHeader>
        <Input 
            defaultValue={receipt.name}
            onBlur={handleNameChange}
            className="text-lg font-semibold border-0 shadow-none -ml-3 focus-visible:ring-1 focus-visible:ring-ring"
        />
        <CardDescription>Assign a payer and review details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Payer</label>
          <Select onValueChange={handlePayerChange} value={receipt.payerId ?? undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select a payer" />
            </SelectTrigger>
            <SelectContent>
              {participants.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Badge variant="outline">{receipt.currency}</Badge>
        <div className="font-semibold">
          Subtotal: {(subtotal / 100).toLocaleString(undefined, { style: 'currency', currency: receipt.currency })}
        </div>
      </CardFooter>
    </Card>
  );
}
