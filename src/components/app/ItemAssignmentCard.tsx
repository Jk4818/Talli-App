
"use client";

import React, { useState } from 'react';
import { type Item, type Discount } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import UserAssignments from './UserAssignments';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Pencil, AlertCircle, Tag, Sparkles, Check, X } from 'lucide-react';
import ItemEditDialog from './ItemEditDialog';
import { updateItem, removeItem, applySuggestedDiscount, ignoreSuggestedDiscount } from '@/lib/redux/slices/sessionSlice';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { formatCurrency } from '@/lib/utils';

interface ItemAssignmentCardProps {
  item: Item;
  itemNumber: number;
  totalItems: number;
  hasIssue?: boolean;
  issueText?: string;
  pendingSuggestion?: { receiptId: string; discount: Discount };
}

export default function ItemAssignmentCard({ item, itemNumber, totalItems, hasIssue, issueText, pendingSuggestion }: ItemAssignmentCardProps) {
  const { receipts } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const receipt = receipts.find(r => r.id === item.receiptId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updates: Partial<Item>) => {
    dispatch(updateItem({ id: item.id, ...updates }));
  };

  const handleDelete = (itemId: string) => {
    dispatch(removeItem(itemId));
  };
  
  const handleApplySuggestion = () => {
    if (pendingSuggestion) {
      dispatch(applySuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
    }
  };

  const handleIgnoreSuggestion = () => {
    if (pendingSuggestion) {
      dispatch(ignoreSuggestedDiscount({ receiptId: pendingSuggestion.receiptId, discountId: pendingSuggestion.discount.id }));
    }
  };

  const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
  const effectiveCost = item.cost - totalItemDiscount;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
              <div className='flex-1 min-w-0'>
                <div className="flex items-center gap-2">
                    {hasIssue && (
                        <AccessibleTooltip content={<p>{issueText || 'This item needs attention.'}</p>}>
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        </AccessibleTooltip>
                    )}
                    <AccessibleTooltip content={<p>{item.name}</p>}>
                      <CardTitle className="text-2xl font-headline truncate cursor-default">{item.name}</CardTitle>
                    </AccessibleTooltip>
                </div>
                  <CardDescription>
                      From: {receipt?.name || 'Unknown Receipt'}
                  </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-5 w-5" />
                </Button>
                <div className="text-right">
                  <Badge variant="secondary" className="text-lg">
                      {formatCurrency(effectiveCost, receipt?.currency || 'USD')}
                  </Badge>
                  {totalItemDiscount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      (was {formatCurrency(item.cost, receipt?.currency || 'USD')})
                    </p>
                  )}
                </div>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingSuggestion && (
            <div className="mb-4 p-3 rounded-md bg-accent/30 border border-primary/20 space-y-3 text-sm">
                <div className="flex justify-between items-start">
                    <div className='flex items-center gap-2 font-semibold text-accent-foreground'>
                        <Sparkles className="h-4 w-4" />
                        AI Discount Suggestion
                    </div>
                    {pendingSuggestion.discount.confidence && <Badge variant="secondary" className="text-primary font-medium"><Sparkles className='h-3 w-3 mr-1.5' /> {pendingSuggestion.discount.confidence}%</Badge>}
                </div>
                <p>
                    A discount for <span className='font-medium'>&quot;{pendingSuggestion.discount.name}&quot;</span> (-{formatCurrency(pendingSuggestion.discount.amount, receipt?.currency || 'USD')}) might apply to this item.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={handleApplySuggestion}>
                        <Check className="mr-1.5 h-4 w-4" /> Apply Discount
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleIgnoreSuggestion}>
                        <X className="mr-1.5 h-4 w-4" /> Ignore
                    </Button>
                </div>
            </div>
          )}
          <p className="text-sm font-medium mb-2">Who is sharing this item?</p>
          <UserAssignments itemId={item.id} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground justify-center">
          Item {itemNumber} of {totalItems}
        </CardFooter>
      </Card>
      <ItemEditDialog
        item={item}
        receipts={receipts}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
