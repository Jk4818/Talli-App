"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { assignItemToUser, unassignItemFromUser, toggleAllAssignees } from '@/lib/redux/slices/sessionSlice';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Users } from 'lucide-react';

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

  const handleToggleAll = () => {
    const assignAll = assignees.length < participants.length;
    dispatch(toggleAllAssignees({ itemId, assignAll }));
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
    <div className="space-y-1">
      <div className="flex justify-end mb-3">
        <Button variant="outline" size="sm" onClick={handleToggleAll} disabled={participants.length === 0}>
          <Users className="mr-2 h-4 w-4" />
          {assignees.length < participants.length ? 'Select All' : 'Deselect All'}
        </Button>
      </div>

      <div className="space-y-1 rounded-md border p-3">
        {participants.map(p => {
            const isChecked = assignees.includes(p.id);
            return (
                <div 
                    key={p.id} 
                    className="flex items-center justify-between rounded-md p-2 -mx-1 hover:bg-secondary/80 cursor-pointer transition-colors"
                    onClick={() => handleAssignmentChange(p.id, !isChecked)}
                >
                    <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                            <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                        </Avatar>
                        <Label htmlFor={`assign-${itemId}-${p.id}`} className="font-normal text-base cursor-pointer">
                            {p.name}
                        </Label>
                    </div>
                    <div className="flex items-center gap-4">
                        {shares[p.id] && (
                            <span className="font-mono text-sm text-muted-foreground">
                                {(shares[p.id] / 100).toLocaleString(undefined, { style: 'currency', currency: receipt?.currency || 'USD' })}
                            </span>
                        )}
                        <Switch
                            id={`assign-${itemId}-${p.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleAssignmentChange(p.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )
        })}
        {participants.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Add participants in Step 1 to assign items.</p>
        )}
        {assignees.length === 0 && itemCost > 0 && participants.length > 0 && <p className="text-center text-destructive text-sm pt-2">This item must be assigned to at least one person.</p>}
      </div>
    </div>
  );
}
