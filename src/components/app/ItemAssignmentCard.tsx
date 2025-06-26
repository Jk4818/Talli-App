"use client";

import React from 'react';
import { Item } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import UserAssignments from './UserAssignments';
import { Badge } from '../ui/badge';

interface ItemAssignmentCardProps {
  item: Item;
  itemNumber: number;
  totalItems: number;
}

export default function ItemAssignmentCard({ item, itemNumber, totalItems }: ItemAssignmentCardProps) {
  const { receipts } = useSelector((state: RootState) => state.session);
  const receipt = receipts.find(r => r.id === item.receiptId);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-headline">{item.name}</CardTitle>
                <CardDescription>
                    From: {receipt?.name || 'Unknown Receipt'}
                </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
                {(item.cost / 100).toLocaleString('en-US', { style: 'currency', currency: receipt?.currency || 'USD' })}
            </Badge>
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
  );
}
