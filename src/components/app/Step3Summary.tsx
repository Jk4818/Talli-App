'use client';

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import { Button } from '../ui/button';
import { resetSession, toggleSettlementPaid } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw, Calculator, Download, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '../ui/label';
import type { SessionState } from '@/lib/types';
import SharePieChart from './SharePieChart';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Avatar, AvatarFallback } from '../ui/avatar';
import ItemSplitDiagram from './ItemSplitDiagram';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SmartSummaryCard from './SmartSummaryCard';

export default function Step3Summary() {
  const sessionState = useSelector((state: RootState) => state.session);
  const { participants, items, receipts, paidSettlements, globalCurrency } = sessionState;
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const calculatedSummary = useMemo(() => {
    // Guard against running calculations if there's no one to split the bill with.
    if (participants.length === 0) {
      return {
        participantSummaries: [],
        settlements: [],
        total: 0,
        totalItemCost: 0,
        totalDiscounts: 0,
        totalServiceCharge: 0,
        roundingOccurred: false,
      };
    }
    // The calculation function is pure and derives its results from the session state.
    // The `paid` status of settlements is handled separately in the component's render logic.
    return calculateSplits(sessionState);
  }, [participants, items, receipts, globalCurrency, sessionState]);


  const handleReset = () => {
    dispatch(resetSession());
    toast({
      title: 'Session Cleared',
      description: 'All session data has been removed.',
    });
  };

  const handleExport = () => {
    try {
      const sessionJson = JSON.stringify(sessionState, null, 2);
      const blob = new Blob([sessionJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talli_session_${new Date().toISOString()}.json`;
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

  const handleTogglePaid = (settlementId: string) => {
    dispatch(toggleSettlementPaid({ settlementId }));
  };

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // This is the key fix. If the session is reset, participants will be empty.
  // Rendering null prevents the component from crashing during its exit animation
  // as its data has been wiped from the Redux store.
  if (participants.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer(0.2, 0.1)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
        <motion.div variants={fadeInUp} className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export Session</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all participants, receipts, and item assignments from the current session. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Yes, Reset Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </motion.div>
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <Scale className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Participant Balances</CardTitle>
                        <CardDescription>The breakdown. Here's the nitty-gritty on each person's tab.</CardDescription>
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
                        <CardDescription>The grand total. From subtotal to service charge, here's the full damage.</CardDescription>
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
                        <CardDescription>Payback time! The easiest way to get even. Mark payments as you go.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                      {calculatedSummary.settlements.length > 0 ? calculatedSummary.settlements.map((s) => {
                        const fromParticipant = participants.find(p => p.name === s.from);
                        const toParticipant = participants.find(p => p.name === s.to);
                        const isPaid = !!paidSettlements[s.id];
                        return (
                          <li
                            key={s.id}
                            className={cn("rounded-lg border bg-card/80 transition-opacity", isPaid && "opacity-60")}
                          >
                           <Label
                              htmlFor={`paid-${s.id}`}
                              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 cursor-pointer hover:bg-accent/50 rounded-lg"
                            >
                              <div className={cn("flex items-center gap-2 font-medium w-full sm:w-auto", isPaid && "line-through")}>
                                  <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>{fromParticipant ? getInitials(fromParticipant.name) : '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{s.from}</span>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{s.to}</span>
                                  <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>{toParticipant ? getInitials(toParticipant.name) : '?'}</AvatarFallback>
                                  </Avatar>
                              </div>
                              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                                <span
                                  className={cn(
                                    'text-xl font-bold text-primary',
                                    isPaid && 'text-muted-foreground line-through'
                                  )}
                                >
                                  {formatCurrency(s.amount)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`paid-${s.id}`}
                                    checked={isPaid}
                                    onCheckedChange={() => handleTogglePaid(s.id)}
                                    aria-label={`Mark transaction from ${s.from} to ${s.to} as paid`}
                                  />
                                  <span
                                    className={cn(
                                      'text-sm font-medium',
                                      isPaid ? 'text-muted-foreground' : 'text-foreground'
                                    )}
                                  >
                                    Paid
                                  </span>
                                </div>
                              </div>
                           </Label>
                          </li>
                        )
                      }) : (
                          <p className="text-center text-muted-foreground py-4">All settled up!</p>
                      )}
                  </ul>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader className='pt-6'>
              <CardTitle>Total Shares</CardTitle>
              <CardDescription>Your bill, visualized. See who's responsible for what slice of the pie.</CardDescription>
            </CardHeader>
            <CardContent>
                <SharePieChart summary={calculatedSummary} />
            </CardContent>
          </Card>
          <SmartSummaryCard summary={calculatedSummary} participants={participants} globalCurrency={globalCurrency} />
        </div>
      </motion.div>
      <motion.div variants={fadeInUp}>
        <ItemSplitDiagram />
      </motion.div>
    </motion.div>
  );
}
