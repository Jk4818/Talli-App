
"use client";

import React, { useState } from 'react';
import { Item } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import UserAssignments from './UserAssignments';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Pencil, AlertCircle } from 'lucide-react';
import ItemEditDialog from './ItemEditDialog';
import { updateItem, removeItem } from '@/lib/redux/slices/sessionSlice';
import { AccessibleTooltip } from '../ui/accessible-tooltip';

interface ItemAssignmentCardProps {
  item: Item;
  itemNumber: number;
  totalItems: number;
  hasIssue?: boolean;
  issueText?: string;
}

export default function ItemAssignmentCard({ item, itemNumber, totalItems, hasIssue, issueText }: ItemAssignmentCardProps) {
  const { receipts } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const receipt = receipts.find(r => r.id === item.receiptId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updates: { name: string; cost: number; receiptId: string }) => {
    dispatch(updateItem({ id: item.id, ...updates }));
  };

  const handleDelete = (itemId: string) => {
    dispatch(removeItem(itemId));
  };

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
                <Badge variant="secondary" className="text-lg">
                    {(item.cost / 100).toLocaleString('en-US', { style: 'currency', currency: receipt?.currency || 'USD' })}
                </Badge>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium mb-2">Who is sharing this item?</p>
          <UserAssignments itemId={item.id} itemCost={item.cost} />
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
