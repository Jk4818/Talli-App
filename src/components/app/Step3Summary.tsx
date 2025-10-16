
'use client';

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import { Button } from '../ui/button';
import { resetSession, toggleSettlementPaid } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw, Calculator, Download, ArrowRight, MessageSquareText, Copy, FileText, Braces, MoreHorizontal, LayoutGrid, Pizza } from 'lucide-react';
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
import { DropDrawer, DropDrawerContent, DropDrawerItem, DropDrawerLabel, DropDrawerSeparator, DropDrawerTrigger } from '../ui/dropdrawer';
import CategoryBreakdownChart from './CategoryBreakdownChart';

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
        roundingAdjustment: undefined,
        roundingOccurred: false,
        roundedItems: [],
      };
    }
    // The calculation function is pure and derives its results from the session state.
    // The `paid` status of settlements is handled separately in the component's render logic.
    return calculateSplits(sessionState);
  }, [sessionState]);

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  const recapText = useMemo(() => {
    const lines = [];
    lines.push(`💰 Bill Summary (Total: ${formatCurrency(calculatedSummary.total)})`);
    lines.push('--------------------');
    
    if (calculatedSummary.settlements.length > 0) {
        lines.push('To settle up:');
        calculatedSummary.settlements.forEach(s => {
            lines.push(`- ${s.from} ➡️ ${s.to}: ${formatCurrency(s.amount)}`);
        });
    } else {
        lines.push("✅ All settled up! No payments needed.");
    }
    lines.push('--------------------');
    lines.push('Generated with Talli');

    return lines.join('\n');
  }, [calculatedSummary, formatCurrency]);


  const handleCopy = () => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(recapText).then(() => {
          toast({
            title: "Copied to clipboard!",
            description: "You can now paste the summary in any messaging app.",
          });
        }).catch(err => {
          console.error('Failed to copy: ', err);
          toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Could not copy the text to your clipboard.',
          });
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Clipboard API not available on your browser.',
        });
    }
  };

  const handleDownloadReport = () => {
    try {
      sessionStorage.setItem('splitzy_report_session', JSON.stringify(sessionState));
      window.open('/report', '_blank');
    } catch (error) {
      console.error("Failed to save session for report:", error);
      toast({
        variant: "destructive",
        title: "Report Failed",
        description: "Could not prepare the report data. Your browser may be blocking session storage."
      });
    }
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
  
  const handleReset = () => {
    dispatch(resetSession());
    toast({
      title: 'Session Cleared',
      description: 'All session data has been removed.',
    });
  };

  const handleTogglePaid = (settlementId: string) => {
    dispatch(toggleSettlementPaid({ settlementId }));
  };

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
            <DropDrawer>
                <DropDrawerTrigger asChild>
                    <Button variant="outline">
                        <MoreHorizontal className="mr-2 h-4 w-4" /> Actions
                    </Button>
                </DropDrawerTrigger>
                <DropDrawerContent>
                    <DropDrawerLabel>Session Actions</DropDrawerLabel>
                    <DropDrawerItem onClick={handleDownloadReport} icon={<FileText className="h-4 w-4"/>}>
                        Download PDF Report
                    </DropDrawerItem>
                    <DropDrawerItem onClick={handleExport} icon={<Braces className="h-4 w-4"/>}>
                        Export Session Data
                    </DropDrawerItem>
                    <DropDrawerSeparator />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <DropDrawerItem
                                asChild
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                icon={<RefreshCw className="h-4 w-4"/>}
                            >
                                <button className='w-max'>Reset Session</button>
                            </DropDrawerItem>
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
                </DropDrawerContent>
            </DropDrawer>
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
                            className={cn("rounded-lg bg-card/80 transition-opacity", isPaid && "opacity-60")}
                          >
                           <Label
                              htmlFor={`paid-${s.id}`}
                              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 cursor-pointer hover:bg-accent/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 font-medium w-full sm:w-auto">
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

            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <LayoutGrid className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Category Breakdown</CardTitle>
                        <CardDescription>A summary of spending by category.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <CategoryBreakdownChart items={items} participants={participants} summary={calculatedSummary} globalCurrency={globalCurrency} />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <MessageSquareText className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Shareable Summary</CardTitle>
                        <CardDescription>A simple text recap for your group.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                            {recapText}
                        </pre>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Recap
                    </Button>
                </CardFooter>
              </Card>
            </motion.div>
          <Card>
            <CardHeader className='pt-6 flex-row items-center gap-4 space-y-0'>
                <Pizza className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Total Shares</CardTitle>
                  <CardDescription>Your bill, visualized. See who's responsible for what slice of the pie.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <SharePieChart summary={calculatedSummary} />
            </CardContent>
          </Card>
          <SmartSummaryCard summary={calculatedSummary} participants={participants} items={items} receipts={receipts} globalCurrency={globalCurrency} />
        </div>
      </motion.div>
      <motion.div variants={fadeInUp}>
        <ItemSplitDiagram />
      </motion.div>
    </motion.div>
  );
}
