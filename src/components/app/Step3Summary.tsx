"use client";

import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import SharePieChart from './SharePieChart';
import { Button } from '../ui/button';
import { resetSession, setSettlements, toggleSettlementPaid } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import type { SessionState } from '@/lib/types';

export default function Step3Summary() {
  const sessionState = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  const { participants, items, receipts, settlements, globalCurrency } = sessionState;

  const summary = useMemo(() => {
    if (participants.length > 0 && items.length > 0) {
      // Pass only the necessary data to prevent re-calculation when irrelevant state (like settlements) changes.
      return calculateSplits({ participants, items, receipts } as SessionState);
    }
    return { 
      participantSummaries: [], 
      settlements: [], 
      total: 0, 
      totalItemCost: 0, 
      totalDiscounts: 0, 
      totalServiceCharge: 0 
    };
  }, [participants, items, receipts]);

  useEffect(() => {
    // This effect runs when the summary calculation changes to update the settlements in the store.
    // The useMemo fix above prevents this from running in a loop.
    if (summary.settlements.length > 0) {
      dispatch(setSettlements(summary.settlements));
    }
  }, [summary.settlements, dispatch]);

  const handleStartNew = () => {
    dispatch(resetSession());
  };

  const handleSave = () => {
    console.log("Session Data:", sessionState);
    console.log("Calculated Summary:", summary);
    toast({
        title: "Session Saved!",
        description: "Your session data has been logged to the browser console."
    })
  };

  const handleTogglePaid = (settlementId: string) => {
    dispatch(toggleSettlementPaid({ settlementId }));
  };

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  return (
    <div className="space-y-8">
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSave}>Save Session</Button>
            <Button onClick={handleStartNew}><RefreshCw className="mr-2 h-4 w-4" /> Start New Session</Button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <Scale className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Participant Balances</CardTitle>
                        <CardDescription>Final shares, payments, and balances for each participant.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <BillSplitSummary summary={summary} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <Calculator className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Overall Bill Calculation</CardTitle>
                        <CardDescription>A summary of the entire bill across all receipts.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Original Items Subtotal</span> <span className="font-medium">{formatCurrency(summary.totalItemCost)}</span></div>
                    {summary.totalDiscounts > 0 && <div className="flex justify-between text-destructive"><span>Discounts</span> <span className="font-medium">- {formatCurrency(summary.totalDiscounts)}</span></div>}
                    <div className="flex justify-between border-t pt-2 mt-2"><span>Subtotal</span> <span className="font-medium">{formatCurrency(summary.totalItemCost - summary.totalDiscounts)}</span></div>
                    {summary.totalServiceCharge > 0 && <div className="flex justify-between"><span>Service Charges & Tips</span> <span className="font-medium">+ {formatCurrency(summary.totalServiceCharge)}</span></div>}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Grand Total</span> <span>{formatCurrency(summary.total)}</span></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <HandCoins className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Settlement Plan</CardTitle>
                        <CardDescription>The simplest way to settle up. Mark transactions as paid.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                <ul className="space-y-3">
                    {settlements.length > 0 ? settlements.map((s) => (
                      <li key={s.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                          <div className={cn("flex-1", s.paid && "line-through text-muted-foreground")}>
                            <span className="font-medium">{s.from}</span>
                            <span className="text-muted-foreground"> should pay </span>
                            <span className="font-medium">{s.to}</span>
                          </div>
                          <span className={cn("font-semibold text-primary mx-4", s.paid && "line-through text-muted-foreground")}>
                              {formatCurrency(s.amount)}
                          </span>
                          <div className="flex items-center space-x-2">
                              <Label htmlFor={`paid-${s.id}`} className={cn("text-sm", s.paid ? 'text-muted-foreground' : 'text-foreground')}>Paid</Label>
                              <Switch
                                  id={`paid-${s.id}`}
                                  checked={s.paid}
                                  onCheckedChange={() => handleTogglePaid(s.id)}
                              />
                          </div>
                      </li>
                    )) : (
                        <p className="text-center text-muted-foreground py-4">All settled up!</p>
                    )}
                </ul>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Total Shares</CardTitle>
              <CardDescription>How the total bill is divided.</CardDescription>
            </CardHeader>
            <CardContent>
              <SharePieChart summary={summary} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
