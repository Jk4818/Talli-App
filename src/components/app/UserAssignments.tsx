"use client";

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { assignItemToUser, unassignItemFromUser, toggleAllAssignees, setItemSplitMode, setPercentageAssignment } from '@/lib/redux/slices/sessionSlice';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { AlertCircle, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { cn } from '@/lib/utils';


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
  const splitMode = item?.splitMode || 'equal';

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
  
  const handleModeChange = (mode: string) => {
    if (mode === 'equal' || mode === 'percentage') {
      dispatch(setItemSplitMode({ itemId, splitMode: mode }));
    }
  };
  
  const handlePercentageChange = (participantId: string, value: string) => {
    // allow empty string to clear value
    if (value === '') {
        dispatch(setPercentageAssignment({ itemId, participantId, percentage: 0 }));
        return;
    }
    const percentage = parseInt(value, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        dispatch(setPercentageAssignment({ itemId, participantId, percentage }));
    }
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const totalPercentage = useMemo(() => {
    if (!item || !item.percentageAssignments) return 0;
    return item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments[pid] || 0), 0);
  }, [item]);


  const shares = useMemo(() => {
    if (!item || assignees.length === 0 || itemCost === 0) return {};
    
    const shares: { [key: string]: number } = {};

    if (item.splitMode === 'equal') {
        const baseShare = Math.floor(itemCost / assignees.length);
        let remainder = itemCost % assignees.length;
        assignees.forEach(id => {
          let share = baseShare;
          if (remainder > 0) {
            share += 1;
            remainder--;
          }
          shares[id] = share;
        });
    } else { // percentage
        if (totalPercentage === 100) {
            let distributedAmount = 0;
            const calculatedShares = assignees.map(id => {
                const percentage = item.percentageAssignments[id] || 0;
                const share = Math.round((itemCost * percentage) / 100);
                distributedAmount += share;
                return { id, share };
            });

            // Distribute rounding errors
            let remainder = itemCost - distributedAmount;
            for (const s of calculatedShares) {
                if (remainder === 0) break;
                if (remainder > 0) {
                    s.share++;
                    remainder--;
                } else if (remainder < 0) {
                    s.share--;
                    remainder++;
                }
            }
            calculatedShares.forEach(s => shares[s.id] = s.share);
        } else {
            assignees.forEach(id => shares[id] = 0);
        }
    }
    return shares;
  }, [item, assignees, itemCost, totalPercentage]);

  const assignedParticipants = participants.filter(p => assignees.includes(p.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={splitMode} onValueChange={handleModeChange} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equal">Equal</TabsTrigger>
            <TabsTrigger value="percentage">Percent</TabsTrigger>
          </TabsList>
        </Tabs>

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
                    className={cn(
                      "flex items-center justify-between rounded-md p-2 -mx-1 transition-colors",
                      splitMode === 'equal' && "hover:bg-secondary/80 cursor-pointer"
                    )}
                    onClick={splitMode === 'equal' ? () => handleAssignmentChange(p.id, !isChecked) : undefined}
                >
                    <div className='flex items-center space-x-3'>
                        <Switch
                            id={`assign-${itemId}-${p.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleAssignmentChange(p.id, checked)}
                        />
                        <Label htmlFor={`assign-${itemId}-${p.id}`} className="font-normal text-base cursor-pointer">
                            {p.name}
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        {splitMode === 'percentage' && isChecked && (
                            <div className="relative w-20">
                                <Input
                                    type="number"
                                    value={item?.percentageAssignments[p.id] || ''}
                                    onChange={e => handlePercentageChange(p.id, e.target.value)}
                                    className="pr-6 text-right"
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        )}
                        {shares[p.id] ? (
                            <span className="font-mono text-sm text-muted-foreground w-20 text-right">
                                {(shares[p.id] / 100).toLocaleString(undefined, { style: 'currency', currency: receipt?.currency || 'USD' })}
                            </span>
                        ) : <div className='w-20'/>}
                    </div>
                </div>
            )
        })}
        {participants.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Add participants in Step 1 to assign items.</p>
        )}
      </div>

      {splitMode === 'percentage' && assignees.length > 0 && totalPercentage !== 100 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Percentages must total 100%</AlertTitle>
          <AlertDescription>
            Current total: {totalPercentage}%.
          </AlertDescription>
        </Alert>
      )}

      {assignees.length === 0 && itemCost > 0 && participants.length > 0 && <p className="text-center text-destructive text-sm pt-2">This item must be assigned to at least one person.</p>}
    </div>
  );
}
