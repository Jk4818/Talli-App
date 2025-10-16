
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { assignItemToUser, unassignItemFromUser, toggleAllAssignees, setItemSplitMode, setPercentageAssignment, setExactAssignment } from '@/lib/redux/slices/sessionSlice';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertCircle, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';


interface UserAssignmentsProps {
  itemId: string;
}

export default function UserAssignments({ itemId }: UserAssignmentsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { participants, items, receipts } = useSelector((state: RootState) => state.session);
  const item = items.find(i => i.id === itemId);
  const receipt = receipts.find(r => r.id === item?.receiptId);
  const assignees = item?.assignees || [];
  const splitMode = item?.splitMode || 'equal';

  const [exactAmountStrings, setExactAmountStrings] = useState<{ [key: string]: string }>({});
  
  const itemCost = useMemo(() => {
    if (!item) return 0;
    const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
    return item.cost - totalItemDiscount;
  }, [item]);

  // Synchronize local input state with Redux state whenever the item changes
  useEffect(() => {
    const initialStrings: { [key: string]: string } = {};
    if (item?.splitMode === 'exact' && item.assignees && item.exactAssignments) {
        // Ensure local state is synced for all current assignees
        item.assignees.forEach(pId => {
            const amount = item.exactAssignments[pId];
            // Set the string value for the input, defaulting to an empty string
            initialStrings[pId] = amount ? (amount / 100).toFixed(2) : '';
        });
    }
    setExactAmountStrings(initialStrings);
  }, [item]); // Depend on the whole item object to catch changes in assignees/assignments


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
    if (mode === 'equal' || mode === 'percentage' || mode === 'exact') {
      dispatch(setItemSplitMode({ itemId, splitMode: mode as 'equal' | 'percentage' | 'exact' }));
    }
  };
  
  const handlePercentageChange = (participantId: string, value: string) => {
    if (value === '') {
        dispatch(setPercentageAssignment({ itemId, participantId, percentage: 0 }));
        return;
    }
     // Only allow integer values
    if (!/^\d*$/.test(value)) {
        return;
    }
    const percentage = parseInt(value, 10);
    if (!isNaN(percentage)) {
        // Clamp value between 0 and 100
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        dispatch(setPercentageAssignment({ itemId, participantId, percentage: clampedPercentage }));
    }
  }
  
  const handleLocalExactAmountChange = (participantId: string, value: string) => {
    // This regex allows for a valid currency format (e.g., 123.45) to be typed.
    if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
        setExactAmountStrings(prev => ({
            ...prev,
            [participantId]: value
        }));
    }
  };

  const handleExactAmountBlur = (participantId: string) => {
    const valueStr = exactAmountStrings[participantId] || '';
    const amountInCents = valueStr ? Math.round(parseFloat(valueStr) * 100) : 0;
    
    // Dispatch the final, parsed value to the Redux store, but only if it's different
    if (!isNaN(amountInCents) && item?.exactAssignments[participantId] !== amountInCents) {
        dispatch(setExactAssignment({ itemId, participantId, amount: amountInCents }));
    }
  };


  const totalPercentage = useMemo(() => {
    if (!item || !item.percentageAssignments) return 0;
    return item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments[pid] || 0), 0);
  }, [item]);
  
  const totalExactAmount = useMemo(() => {
    if (!item || !item.exactAssignments) return 0;
    return item.assignees.reduce((sum, pid) => sum + (item.exactAssignments[pid] || 0), 0);
  }, [item]);


  const shares = useMemo(() => {
    if (!item || assignees.length === 0 || itemCost <= 0) return {};
    
    const shares: { [key: string]: number } = {};

    if (item.splitMode === 'equal') {
        const baseShare = Math.floor(itemCost / assignees.length);
        let remainder = itemCost % assignees.length;
        
        // Sort assignees by ID to make rounding distribution deterministic in this view
        const sortedAssignees = [...assignees].sort((a,b) => a.localeCompare(b));

        sortedAssignees.forEach(id => {
          shares[id] = baseShare;
        });
        
        // Distribute the remainder pennies to the first N people in the sorted list
        for(let i = 0; i < remainder; i++) {
          const pidToAdjust = sortedAssignees[i];
          shares[pidToAdjust] += 1;
        }
    } else if (item.splitMode === 'percentage') {
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
            // Sort by ID to make rounding deterministic in this view
            const sortedCalculatedShares = calculatedShares.sort((a,b) => a.id.localeCompare(b.id));

            for (let i = 0; i < Math.abs(remainder); i++) {
                const amountToDistribute = remainder > 0 ? 1 : -1;
                sortedCalculatedShares[i % sortedCalculatedShares.length].share += amountToDistribute;
            }
            sortedCalculatedShares.forEach(s => shares[s.id] = s.share);
        } else {
            assignees.forEach(id => shares[id] = 0);
        }
    } else if (item.splitMode === 'exact') {
      if (totalExactAmount === itemCost) {
          assignees.forEach(pid => {
              shares[pid] = item.exactAssignments[pid] || 0;
          });
      } else {
          assignees.forEach(id => shares[id] = 0);
      }
    }
    return shares;
  }, [item, assignees, itemCost, totalPercentage, totalExactAmount]);

  if (!item) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs value={splitMode} onValueChange={handleModeChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equal">Equal</TabsTrigger>
            <TabsTrigger value="percentage">Percent</TabsTrigger>
            <TabsTrigger value="exact">Exact</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAll}
          disabled={participants.length === 0}
          className="w-full sm:w-32"
        >
          <Users className="mr-2 h-4 w-4" />
          {assignees.length < participants.length ? 'Select All' : 'Deselect All'}
        </Button>
      </div>

      <div className="space-y-1">
        <div className="rounded-md border p-3">
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
                                      type="text"
                                      inputMode="numeric"
                                      value={item?.percentageAssignments[p.id] || ''}
                                      onChange={e => handlePercentageChange(p.id, e.target.value)}
                                      className="pr-6 text-right"
                                      placeholder="0"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                              </div>
                          )}
                          {splitMode === 'exact' && isChecked && (
                              <div className="relative w-24">
                                  <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={exactAmountStrings[p.id] || ''}
                                      onChange={e => handleLocalExactAmountChange(p.id, e.target.value)}
                                      onBlur={() => handleExactAmountBlur(p.id)}
                                      className="pl-4 text-right"
                                      placeholder="0.00"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{receipt?.currency}</span>
                              </div>
                          )}
                          {shares[p.id] ? (
                              <span className="font-mono text-sm text-muted-foreground w-20 text-right">
                                  {formatCurrency(shares[p.id], receipt?.currency || 'USD' )}
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

        {assignees.length === 0 && itemCost > 0 && participants.length > 0 && <p className="text-center text-destructive text-sm pt-2">This item must be assigned to at least one person.</p>}
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
      
      {splitMode === 'exact' && assignees.length > 0 && totalExactAmount !== itemCost && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Amounts must total {formatCurrency(itemCost, receipt?.currency || 'USD')}</AlertTitle>
          <AlertDescription>
            Current total: {formatCurrency(totalExactAmount, receipt?.currency || 'USD')}. Remaining: {formatCurrency(itemCost - totalExactAmount, receipt?.currency || 'USD')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
