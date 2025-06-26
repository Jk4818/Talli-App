
"use client";

import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import { Button } from '../ui/button';
import { resetSession, setSettlements, toggleSettlementPaid } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw, Calculator, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import type { SessionState } from '@/lib/types';
import SharePieChart from './SharePieChart';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function Step3Summary() {
  const sessionState = useSelector((state: RootState) => state.session);
  const { participants, items, receipts, settlements, globalCurrency } = sessionState;
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // Step 1: Calculate the summary and settlement plan in a memoized function.
  // This is a pure calculation based on the core data (participants, items, receipts).
  // It only re-runs when that core data changes, not when settlements are marked as 'paid'.
  const calculatedSummary = useMemo(() => {
    if (participants.length > 0) {
      // Create a full SessionState object to satisfy the strict type checking in Vercel's build environment.
      // The calculateSplits function only uses a subset of these properties, so the dummy values are safe.
      const tempState: SessionState = {
        participants,
        items,
        receipts,
        settlements: [], // Use an empty array to avoid dependency cycles
        globalCurrency,
        // Add dummy values for the remaining required properties
        step: 3,
        status: 'succeeded',
        error: null,
        isDemoSession: false,
        currentAssignmentIndex: 0,
      };
      return calculateSplits(tempState);
    }
    // Return a default empty summary if there are no participants.
    return {
      participantSummaries: [],
      settlements: [],
      total: 0,
      totalItemCost: 0,
      totalDiscounts: 0,
      totalServiceCharge: 0
    };
  }, [participants, items, receipts, globalCurrency]);

  // Step 2: Sync the calculated settlement plan with the Redux store.
  // This effect runs ONLY when the calculated plan changes (i.e., when core data changes).
  // This avoids the infinite loop because it does not depend on the `settlements` from the store.
  useEffect(() => {
    // The `setSettlements` reducer is smart enough to preserve the `paid` state.
    dispatch(setSettlements(calculatedSummary.settlements));
  }, [calculatedSummary.settlements, dispatch]);


  const handleStartNew = () => {
    dispatch(resetSession());
  };

  const handleExport = () => {
    try {
      const sessionJson = JSON.stringify(sessionState, null, 2);
      const blob = new Blob([sessionJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `splitzy_session_${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Session Exported!",
        description: "Your session data has been downloaded as a JSON file."
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Could not export the session data."
      });
    }
  };

  // This action only dispatches a minimal update and does not trigger a full recalculation.
  const handleTogglePaid = (settlementId: string) => {
    dispatch(toggleSettlementPaid({ settlementId }));
  };

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  // For rendering, we use `calculatedSummary` for display values and `settlements` from the store
  // for the list, as it contains the correct `paid` status.
  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer(0.2, 0.1)}
      initial="hidden"
      animate="show"
    >
        <motion.div variants={fadeInUp} className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export Session</Button>
            <Button onClick={handleStartNew}><RefreshCw className="mr-2 h-4 w-4" /> Start New Session</Button>
        </motion.div>
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <BillSplitSummary summary={calculatedSummary} />
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
                    <div className="flex justify-between"><span>Original Items Subtotal</span> <span className="font-medium">{formatCurrency(calculatedSummary.totalItemCost)}</span></div>
                    {calculatedSummary.totalDiscounts > 0 && <div className="flex justify-between text-destructive"><span>Discounts</span> <span className="font-medium">- {formatCurrency(calculatedSummary.totalDiscounts)}</span></div>}
                    <div className="flex justify-between border-t pt-2 mt-2"><span>Subtotal</span> <span className="font-medium">{formatCurrency(calculatedSummary.totalItemCost - calculatedSummary.totalDiscounts)}</span></div>
                    {calculatedSummary.totalServiceCharge > 0 && <div className="flex justify-between"><span>Service Charges & Tips</span> <span className="font-medium">+ {formatCurrency(calculatedSummary.totalServiceCharge)}</span></div>}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Grand Total</span> <span>{formatCurrency(calculatedSummary.total)}</span></div>
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
                      <li
                        key={s.id}
                        className="flex flex-col gap-2 rounded-md bg-secondary/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className={cn(s.paid && 'text-muted-foreground')}>
                          <span className="font-medium">{s.from}</span>
                          <span> should pay </span>
                          <span className="font-medium">{s.to}</span>
                        </div>
                        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                          <span
                            className={cn(
                              'font-semibold text-primary',
                              s.paid && 'text-muted-foreground line-through'
                            )}
                          >
                            {formatCurrency(s.amount)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Label
                              htmlFor={`paid-${s.id}`}
                              className={cn(
                                'text-sm',
                                s.paid ? 'text-muted-foreground' : 'text-foreground'
                              )}
                            >
                              Paid
                            </Label>
                            <Switch
                              id={`paid-${s.id}`}
                              checked={s.paid}
                              onCheckedChange={() => handleTogglePaid(s.id)}
                            />
                          </div>
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
            <CardHeader className='pt-6'>
              <CardTitle>Total Shares</CardTitle>
              <CardDescription>How the total bill is divided.</CardDescription>
            </CardHeader>
            <CardContent>
                <SharePieChart summary={calculatedSummary} />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
