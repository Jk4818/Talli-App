"use client";

import React, { useState } from 'react';
import { Item } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import UserAssignments from './UserAssignments';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Pencil } from 'lucide-react';
import ItemEditDialog from './ItemEditDialog';
import { updateItem } from '@/lib/redux/slices/sessionSlice';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ItemAssignmentCardProps {
  item: Item;
  itemNumber: number;
  totalItems: number;
}

export default function ItemAssignmentCard({ item, itemNumber, totalItems }: ItemAssignmentCardProps) {
  const { receipts } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const receipt = receipts.find(r => r.id === item.receiptId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updates: { name: string, cost: number }) => {
    dispatch(updateItem({ id: item.id, ...updates }));
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
              <div className='flex-1 min-w-0'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="text-2xl font-headline truncate cursor-default">{item.name}</CardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSave={handleSave}
      />
    </>
  );
}
