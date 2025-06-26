"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { assignItemToUser, unassignItemFromUser } from '@/lib/redux/slices/sessionSlice';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface UserAssignmentsProps {
  itemId: string;
  itemCost: number; // in cents
}

export default function UserAssignments({ itemId, itemCost }: UserAssignmentsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { participants, items, receipts } = useSelector((state: RootState) => state.session);
  const item = items.find(i => i.id === itemId);
  const receipt = receipts.find(r => r.id === item?.receiptId);
  const assignees = item?.assignees || [];

  const handleAssignmentChange = (participantId: string, checked: boolean) => {
    if (checked) {
      dispatch(assignItemToUser({ itemId, participantId }));
    } else {
      dispatch(unassignItemFromUser({ itemId, participantId }));
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const calculateShares = () => {
    if (assignees.length === 0) return {};
    const baseShare = Math.floor(itemCost / assignees.length);
    let remainder = itemCost % assignees.length;
    const shares: { [key: string]: number } = {};
    assignees.forEach(id => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder--;
      }
      shares[id] = share;
    });
    return shares;
  };

  const shares = calculateShares();

  return (
    <div className="space-y-3 rounded-md border p-4">
      {participants.map(p => (
        <div key={p.id} className="flex items-center justify-between">
            <div className='flex items-center space-x-3'>
                <Checkbox
                    id={`assign-${itemId}-${p.id}`}
                    checked={assignees.includes(p.id)}
                    onCheckedChange={(checked) => handleAssignmentChange(p.id, !!checked)}
                />
                <Avatar className='h-8 w-8'>
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <Label htmlFor={`assign-${itemId}-${p.id}`} className="font-normal text-base cursor-pointer">
                    {p.name}
                </Label>
            </div>
          {shares[p.id] && (
            <span className="font-mono text-sm text-muted-foreground">
                {(shares[p.id] / 100).toLocaleString(undefined, { style: 'currency', currency: receipt?.currency || 'USD' })}
            </span>
          )}
        </div>
      ))}
      {assignees.length === 0 && itemCost > 0 && <p className="text-center text-destructive text-sm pt-2">This item must be assigned to at least one person.</p>}
    </div>
  );
}
