
"use client";

import React, { useState, useEffect } from 'react';
import { Item, Receipt } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { Trash2 } from 'lucide-react';


interface ItemEditDialogProps {
  item: Item | null;
  receipts: Receipt[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updates: { name: string; cost: number; receiptId: string }) => void;
  onDelete: (itemId: string) => void;
}

export default function ItemEditDialog({ item, receipts, isOpen, onOpenChange, onSave, onDelete }: ItemEditDialogProps) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [receiptId, setReceiptId] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCost((item.cost / 100).toFixed(2));
      setReceiptId(item.receiptId);
    }
  }, [item]);

  const handleSave = () => {
    const costInCents = Math.round(parseFloat(cost) * 100);
    if (name.trim() && !isNaN(costInCents) && receiptId) {
      onSave({ name: name.trim(), cost: costInCents, receiptId });
      onOpenChange(false);
    }
  };
  
  const handleDelete = () => {
      if(item) {
          onDelete(item.id);
          onOpenChange(false);
      }
  }

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details for this item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
              Cost
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
            <Select value={receiptId} onValueChange={setReceiptId} disabled={receipts.length === 0}>
                <SelectTrigger id="receipt" className="col-span-3">
                    <SelectValue placeholder="Select a receipt" />
                </SelectTrigger>
                <SelectContent>
                    {receipts.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
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
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
