
"use client";

import React, { useState } from 'react';
import { type Item } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import UserAssignments from './UserAssignments';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Pencil, AlertCircle, Tag } from 'lucide-react';
import ItemEditDialog from './ItemEditDialog';
import { updateItem, removeItem } from '@/lib/redux/slices/sessionSlice';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { formatCurrency, cn } from '@/lib/utils';

interface ItemAssignmentCardProps {
  item: Item;
  itemNumber: number;
  totalItems: number;
  hasIssue?: boolean;
  issueText?: string;
}

export default function ItemAssignmentCard({ item, itemNumber, totalItems, hasIssue, issueText }: ItemAssignmentCardProps) {
  const { receipts, items, participants } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const receipt = receipts.find(r => r.id === item.receiptId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updates: Partial<Item>) => {
    dispatch(updateItem({ id: item.id, ...updates }));
  };

  const handleDelete = (itemId: string) => {
    dispatch(removeItem(itemId));
  };
  
  const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
  const effectiveCost = item.cost - totalItemDiscount;
  const showUnitCost = item.quantity > 1 && item.unitCost;
  const needsAssignment = item.assignees.length === 0 && effectiveCost > 0;

  return (
    <>
      <Card className="flex flex-col">
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
                      <CardTitle className="text-2xl font-headline truncate cursor-default">
                        {item.name}
                        {item.quantity > 1 && <span className="text-muted-foreground font-light ml-2">x{item.quantity}</span>}
                      </CardTitle>
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
                  {(totalItemDiscount > 0 || showUnitCost) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {showUnitCost && `@ ${formatCurrency(item.unitCost!, receipt?.currency || 'USD')} each`}
                      {totalItemDiscount > 0 && ` (was ${formatCurrency(item.cost, receipt?.currency || 'USD')})`}
                    </p>
                  )}
                </div>
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm font-medium mb-2">Who is sharing this item?</p>
          <UserAssignments itemId={item.id} />
        </CardContent>
        <CardFooter className={cn("flex-col gap-2 text-sm text-muted-foreground text-center transition-all pt-4", needsAssignment && participants.length > 0 ? "border-t" : "")}>
           {needsAssignment && participants.length > 0 && <p className="text-center text-destructive text-sm font-medium">This item must be assigned to at least one person.</p>}
          <p>Item {itemNumber} of {totalItems}</p>
        </CardFooter>
      </Card>
      <ItemEditDialog
        item={item}
        items={items}
        receipts={receipts}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSave={handleSave}
        onDelete={handleDelete}
        pendingSuggestion={null} 
      />
    </>
  );
}
