
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
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                icon={<RefreshCw className="h-4 w-4"/>}
                            >
                                Reset Session
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
            {/* ── Participant Balances ── */}
            <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Scale className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-[13px] font-semibold font-body">Participant Balances</CardTitle>
                        <CardDescription className="text-xs">Who paid what, and who owes who.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-3">
                    <BillSplitSummary summary={calculatedSummary} />
                </CardContent>
            </Card>

            {/* ── Settlement Plan ── */}
            <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <HandCoins className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-[13px] font-semibold font-body">Settlement Plan</CardTitle>
                        <CardDescription className="text-xs">Mark each payment as it's made.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-3">
                  <ul className="space-y-0.5">
                      {calculatedSummary.settlements.length > 0 ? calculatedSummary.settlements.map((s) => {
                        const fromParticipant = participants.find(p => p.name === s.from);
                        const isPaid = !!paidSettlements[s.id];
                        return (
                          <li key={s.id}>
                            <Label
                              htmlFor={`paid-${s.id}`}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                                "hover:bg-secondary/60",
                                isPaid && "opacity-50"
                              )}
                            >
                              {/* From avatar */}
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-bold font-headline">
                                  {fromParticipant ? getInitials(fromParticipant.name) : '?'}
                                </AvatarFallback>
                              </Avatar>

                              {/* From → To */}
                              <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                                <span className="text-sm font-semibold font-headline truncate">{s.from}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-sm font-body text-muted-foreground truncate">{s.to}</span>
                              </div>

                              {/* Amount */}
                              <span className={cn(
                                'text-sm font-bold font-headline tabular-nums shrink-0',
                                isPaid ? 'text-muted-foreground line-through' : 'text-primary'
                              )}>
                                {formatCurrency(s.amount)}
                              </span>

                              {/* Paid checkbox */}
                              <Checkbox
                                id={`paid-${s.id}`}
                                checked={isPaid}
                                onCheckedChange={() => handleTogglePaid(s.id)}
                                className="shrink-0"
                                aria-label={`Mark payment from ${s.from} to ${s.to} as paid`}
                              />
                            </Label>
                          </li>
                        )
                      }) : (
                        <div className="flex flex-col items-center gap-1.5 py-5 text-center">
                          <span className="text-xl" role="img" aria-label="Celebration">🎉</span>
                          <p className="text-[13px] font-semibold font-body" style={{ color: '#E879F9' }}>All settled up!</p>
                          <p className="text-xs font-body text-muted-foreground">No payments needed.</p>
                        </div>
                      )}
                  </ul>
                </CardContent>
            </Card>

            {/* ── Category Breakdown ── */}
            <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-[13px] font-semibold font-body">Category Breakdown</CardTitle>
                        <CardDescription className="text-xs">Spending by category, per person or total.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <CategoryBreakdownChart items={items} participants={participants} summary={calculatedSummary} globalCurrency={globalCurrency} />
                </CardContent>
            </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="lg:col-span-1 space-y-8">
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <MessageSquareText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-[13px] font-semibold font-body">Shareable Summary</CardTitle>
                        <CardDescription className="text-xs">Text recap ready to paste anywhere.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                        <pre className="text-xs whitespace-pre-wrap font-body text-muted-foreground leading-relaxed">
                            {recapText}
                        </pre>
                    </div>
                </CardContent>
                <CardFooter className="pt-3">
                    <Button className="w-full" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Recap
                    </Button>
                </CardFooter>
              </Card>
            </motion.div>

          {/* ── Total Shares pie ── */}
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                    <Pizza className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-[13px] font-semibold font-body">Total Shares</CardTitle>
                  <CardDescription className="text-xs">Who's responsible for which slice.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
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
