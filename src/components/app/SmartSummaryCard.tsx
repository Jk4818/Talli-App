
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant, Item, Receipt, ParticipantSummary } from '@/lib/types';
import { Lightbulb, Scale, Sparkles, Info, Trophy, Gem, Pizza, Bot, Award, HeartHandshake, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';


const InfoDialog = ({ title, description, trigger }: { title: string, description: React.ReactNode, trigger: React.ReactNode }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {trigger}
    </AlertDialogTrigger>
    <AlertDialogContent className="flex flex-col max-h-[85vh]">
      <AlertDialogHeader className="border-b p-6">
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </AlertDialogHeader>
      <ScrollArea className="flex-1 p-0">
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left text-sm text-foreground/80 p-6">
              {description}
            </div>
          </AlertDialogDescription>
      </ScrollArea>
      <AlertDialogFooter className="border-t p-6">
        <AlertDialogAction>Got it</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);


const SmartSummaryItem = ({ icon, title, children }: { icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode }) => (
    <li className="flex items-center gap-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            {title}
        </div>
        <div className="text-right shrink-0">
            {children}
        </div>
    </li>
);


export default function SmartSummaryCard({ summary, participants, items, receipts, globalCurrency }: SmartSummaryCardProps) {
    const formatCurrency = React.useCallback((amount: number) => {
      if (typeof amount !== 'number') return '';
      return (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });
    }, [globalCurrency]);

    const averageShare = participants.length > 0 ? summary.total / participants.length : 0;
    
    const fairnessInfoDescription = (
      <>
        <p>This metric shows how evenly the total cost was distributed. Here's the exact calculation for your session:</p>
        <div className="space-y-3 rounded-md border p-3 bg-muted/50">
          <div className="flex justify-between">
            <span>Total Bill:</span>
            <span className="font-mono">{formatCurrency(summary.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Participants:</span>
            <span className="font-mono">{participants.length}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Average Share per Person:</span>
            <span className="font-mono">{formatCurrency(averageShare)}</span>
          </div>
        </div>
        <p>The deviation for each participant from the average is:</p>
        <ul className="list-disc pl-5 space-y-1">
          {summary.participantSummaries.map(p => (
            <li key={p.id}>
              <strong>{p.name}:</strong> {formatCurrency(p.totalShare)}
              <span className="text-muted-foreground ml-2">
                ({p.totalShare > averageShare ? '+' : ''}{formatCurrency(p.totalShare - averageShare)})
              </span>
            </li>
          ))}
        </ul>
        <p>The "Fairness Check" percentage shows the largest of these deviations relative to the average share.</p>
      </>
    );

    const { roundingAdjustment, roundedItems } = summary;

    const pennyPerfectDialogDescription = React.useMemo(() => {
        if (roundedItems.length === 0 && !roundingAdjustment) {
             return <p>All items in this session were split perfectly without any need for rounding adjustments.</p>
        }

        const introText = roundedItems.length > 0 ? <p>This happens when an item's cost doesn't divide perfectly into cents among the sharers. The app distributes these extra pennies one by one to ensure fairness. The following items from your session required this kind of adjustment:</p> : null;

        return (
            <>
                {introText}
                {roundedItems.length > 0 && (
                    <div className="mt-4 rounded-md border bg-muted/50">
                        <div className="space-y-3 p-2">
                            {roundedItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <Separator className="my-2 bg-border/50" />}
                                    <div>
                                        <div className="flex justify-between font-semibold">
                                            <span>Item:</span>
                                            <span className="font-mono text-right">{item.name}</span>
                                        </div>
                                        <div className="flex justify-between text-xs pl-4">
                                            <span className='text-muted-foreground'>Cost:</span>
                                            <span className="font-mono">{formatCurrency(item.cost)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs pl-4">
                                            <span className='text-muted-foreground'>Split between:</span>
                                            <span className="font-mono">{item.assigneesCount} people</span>
                                        </div>
                                        {item.adjustments.map((adj, adjIndex) => (
                                            <div key={adjIndex} className="flex justify-between text-xs pl-4">
                                                <span className='text-muted-foreground'>
                                                    → {adj.participantName} paid
                                                </span>
                                                <span className="font-mono">
                                                    {formatCurrency(Math.abs(adj.amount))}{' '}{adj.amount > 0 ? 'more' : 'less'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
                {roundingAdjustment && roundingAdjustment.amount !== 0 && (
                     <p className='mt-4'>After all items were calculated, a final session-wide adjustment of <strong>{formatCurrency(Math.abs(roundingAdjustment.amount))}</strong> was {roundingAdjustment.amount > 0 ? 'added to' : 'subtracted from'} <strong>{roundingAdjustment.participantName}'s</strong> share to make the grand total exact.</p>
                )}
            </>
        );
    }, [roundedItems, roundingAdjustment, formatCurrency]);


    const fairnessMetric = React.useMemo(() => {
        if (!summary.total || participants.length < 2) {
            return null;
        }
        if (averageShare === 0) {
            return { text: "Perfectly even", value: "0.0%" };
        }
        
        const deviations = summary.participantSummaries.map(p =>
            Math.abs(p.totalShare - averageShare)
        );
        
        const maxDeviation = Math.max(...deviations);
        const maxDeviationPercent = (maxDeviation / averageShare) * 100;
        
        return {
            text: `±${maxDeviationPercent.toFixed(1)}% of even`,
            value: `±${maxDeviationPercent.toFixed(1)}%`
        };
    }, [summary, participants, averageShare]);


    const highestPayer = React.useMemo(() => {
      if (!summary.participantSummaries || summary.participantSummaries.length === 0) return null;
      return summary.participantSummaries.reduce((max, p) => (p.totalPaid > max.totalPaid ? p : max), summary.participantSummaries[0]);
    }, [summary.participantSummaries]);

    const highestShare = React.useMemo(() => {
      if (!summary.participantSummaries || summary.participantSummaries.length === 0) return null;
      return summary.participantSummaries.reduce((max, p) => (p.totalShare > max.totalShare ? p : max), summary.participantSummaries[0]);
    }, [summary.participantSummaries]);

    const mostExpensiveItem = React.useMemo(() => {
      const itemsWithCost = items.filter(i => i.cost > 0);
      if (itemsWithCost.length === 0) return null;
      return itemsWithCost.reduce((max, item) => (item.cost > max.cost ? item : max), itemsWithCost[0]);
    }, [items]);
    
    const aiConfidence = React.useMemo(() => {
        const receiptsWithConfidence = receipts.filter(r => r.overallConfidence !== undefined && r.status === 'processed');
        if (receiptsWithConfidence.length === 0) return null;
        const totalConfidence = receiptsWithConfidence.reduce((sum, r) => sum + r.overallConfidence!, 0);
        return Math.round(totalConfidence / receiptsWithConfidence.length);
    }, [receipts]);

    const aiConfidenceDialogDescription = (
      <>
        <p>This is the average confidence score from all AI-scanned receipts in this session. A lower score suggests you should double-check the extracted data. Here's the breakdown:</p>
        <div className="space-y-3 rounded-md border p-3 bg-muted/50 mt-4">
          {receipts
            .filter(r => r.overallConfidence !== undefined && r.status === 'processed')
            .map((r, index, arr) => (
              <React.Fragment key={r.id}>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-4">{r.name}</span>
                  <span className="font-mono font-semibold">{r.overallConfidence}%</span>
                </div>
                {index < arr.length - 1 && <Separator />}
              </React.Fragment>
            ))
          }
        </div>
      </>
    );

    const topSaver = React.useMemo(() => {
      if (participants.length === 0 || summary.participantSummaries.length === 0) return null;
      const topSaverParticipant = summary.participantSummaries.reduce(
        (max, p) => {
            const maxSavings = Math.abs((max?.breakdown.discounts || []).reduce((sum, d) => sum + d.amount, 0));
            const currentSavings = Math.abs((p.breakdown.discounts || []).reduce((sum, d) => sum + d.amount, 0));
            return currentSavings > maxSavings ? p : max;
        }
      );
      const maxSavings = Math.abs((topSaverParticipant?.breakdown.discounts || []).reduce((sum, d) => sum + d.amount, 0));
      if (maxSavings > 0) return { name: topSaverParticipant.name, amount: maxSavings };
      return null;
    }, [summary.participantSummaries, participants]);


    const socialButterfly = React.useMemo(() => {
        if (participants.length < 2) return null;

        const butterflyData = participants
            .map(p => {
                const connections = new Set<string>();
                items.forEach(item => {
                    if (item.assignees.length > 1 && item.assignees.includes(p.id)) {
                        item.assignees.forEach(otherId => {
                            if (otherId !== p.id) connections.add(otherId);
                        });
                    }
                });
                return { name: p.name, count: connections.size };
            })
            .reduce((max, current) => (current.count > max.count ? current : max));

        if (butterflyData.count > 0) return butterflyData;
        return null;
    }, [items, participants]);

    return (
        <Card>
            <CardHeader className='flex-row items-center gap-4 space-y-0'>
                <Lightbulb className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>Smart Summary</CardTitle>
                    <CardDescription>A few insights about your split.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="divide-y divide-border/50">
                    {aiConfidence !== null && (
                        <SmartSummaryItem
                            icon={<Bot className="h-5 w-5" />}
                            title={
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <p>AI Confidence</p>
                                    <InfoDialog title="AI Confidence Breakdown" description={aiConfidenceDialogDescription} trigger={
                                        <button className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle" aria-label="More information"><Info className="h-4 w-4 text-muted-foreground" /></button>
                                    }/>
                                </div>
                            }
                        >
                            <p className="font-medium text-foreground">{aiConfidence}%</p>
                        </SmartSummaryItem>
                    )}
                    {fairnessMetric && (
                         <SmartSummaryItem
                            icon={<Scale className="h-5 w-5" />}
                            title={
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                   <p>Fairness Check</p>
                                   <InfoDialog title="Fairness Check Calculation" description={fairnessInfoDescription} trigger={
                                       <button className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle" aria-label="More information"><Info className="h-4 w-4 text-muted-foreground" /></button>
                                   }/>
                                </div>
                            }
                        >
                            <p className="font-medium text-foreground">{fairnessMetric.value}</p>
                            <p className="text-xs text-muted-foreground">{fairnessMetric.text}</p>
                        </SmartSummaryItem>
                    )}
                    {summary.roundingOccurred && (
                        <SmartSummaryItem
                            icon={<Sparkles className="h-5 w-5" />}
                            title={
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <p>Penny Perfect</p>
                                    <InfoDialog title="Penny Perfect Breakdown" description={pennyPerfectDialogDescription} trigger={
                                        <button className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle" aria-label="More information"><Info className="h-4 w-4 text-muted-foreground" /></button>
                                    }/>
                               </div>
                            }
                        >
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">Adjusted</p>
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                            </div>
                        </SmartSummaryItem>
                    )}
                    {topSaver && (
                        <SmartSummaryItem
                            icon={<Award className="h-5 w-5" />}
                            title={<p className="font-semibold text-foreground">Top Saver</p>}
                        >
                            <p className="font-medium text-foreground truncate">{topSaver.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(topSaver.amount)}</p>
                        </SmartSummaryItem>
                    )}
                    {socialButterfly && (
                        <SmartSummaryItem
                            icon={<HeartHandshake className="h-5 w-5" />}
                            title={<p className="font-semibold text-foreground">Social Butterfly</p>}
                        >
                           <p className="font-medium text-foreground truncate">{socialButterfly.name}</p>
                           <p className="text-xs text-muted-foreground">{socialButterfly.count} connections</p>
                        </SmartSummaryItem>
                    )}
                    {highestPayer && highestPayer.totalPaid > 0 && (
                        <SmartSummaryItem
                            icon={<Trophy className="h-5 w-5" />}
                            title={<p className="font-semibold text-foreground">Top Payer</p>}
                        >
                            <p className="font-medium text-foreground truncate">{highestPayer.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(highestPayer.totalPaid)}</p>
                        </SmartSummaryItem>
                    )}
                    {highestShare && highestShare.totalShare > 0 && (
                        <SmartSummaryItem
                            icon={<Pizza className="h-5 w-5" />}
                            title={<p className="font-semibold text-foreground">Highest Share</p>}
                        >
                           <p className="font-medium text-foreground truncate">{highestShare.name}</p>
                           <p className="text-xs text-muted-foreground">{formatCurrency(highestShare.totalShare)}</p>
                        </SmartSummaryItem>
                    )}
                    {mostExpensiveItem && (
                        <SmartSummaryItem
                            icon={<Gem className="h-5 w-5" />}
                            title={<p className="font-semibold text-foreground">Priciest Item</p>}
                        >
                             <p className="font-medium text-foreground truncate">{mostExpensiveItem.name}</p>
                             <p className="text-xs text-muted-foreground">{formatCurrency(mostExpensiveItem.cost)}</p>
                        </SmartSummaryItem>
                    )}
                </ul>
            </CardContent>
        </Card>
    );
}
