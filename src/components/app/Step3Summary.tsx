
"use client";

import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import { Button } from '../ui/button';
import { resetSession, setSettlements, toggleSettlementPaid } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw, Calculator, Download, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import type { SessionState } from '@/lib/types';
import SharePieChart from './SharePieChart';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Avatar, AvatarFallback } from '../ui/avatar';
import ItemSplitDiagram from './ItemSplitDiagram';

export default function Step3Summary() {
  const sessionState = useSelector((state: RootState) => state.session);
  const { participants, items, receipts, settlements, globalCurrency } = sessionState;
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const calculatedSummary = useMemo(() => {
    if (participants.length > 0) {
      const tempState: SessionState = {
        participants,
        items,
        receipts,
        settlements: [],
        globalCurrency,
        step: 3,
        status: 'succeeded',
        error: null,
        isDemoSession: false,
        currentAssignmentIndex: 0,
      };
      return calculateSplits(tempState);
    }
    return {
      participantSummaries: [],
      settlements: [],
      total: 0,
      totalItemCost: 0,
      totalDiscounts: 0,
      totalServiceCharge: 0
    };
  }, [participants, items, receipts, globalCurrency]);

  useEffect(() => {
    dispatch(setSettlements(calculatedSummary.settlements));
  }, [calculatedSummary.settlements, dispatch]);


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
            <Button onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4" /> Reset Session</Button>
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
                  <ul className="space-y-4">
                      {settlements.length > 0 ? settlements.map((s) => {
                        const fromParticipant = participants.find(p => p.name === s.from);
                        const toParticipant = participants.find(p => p.name === s.to);
                        return (
                          <li
                            key={s.id}
                            className={cn("rounded-lg border bg-card/80 p-4 transition-opacity", s.paid && "opacity-60")}
                          >
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className={cn("flex items-center gap-2 font-medium w-full sm:w-auto", s.paid && "line-through")}>
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
                                    s.paid && 'text-muted-foreground line-through'
                                  )}
                                >
                                  {formatCurrency(s.amount)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`paid-${s.id}`}
                                    checked={s.paid}
                                    onCheckedChange={() => handleTogglePaid(s.id)}
                                    aria-label={`Mark transaction from ${s.from} to ${s.to} as paid`}
                                  />
                                  <Label
                                    htmlFor={`paid-${s.id}`}
                                    className={cn(
                                      'text-sm font-medium',
                                      s.paid ? 'text-muted-foreground' : 'text-foreground'
                                    )}
                                  >
                                    Paid
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      }) : (
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
      <motion.div variants={fadeInUp}>
        <ItemSplitDiagram />
      </motion.div>
    </motion.div>
  );
}
