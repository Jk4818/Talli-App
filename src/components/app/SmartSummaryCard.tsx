
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant, Item, Receipt } from '@/lib/types';
import { Lightbulb, Scale, Sparkles, Info } from 'lucide-react';
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
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface SmartSummaryCardProps {
  summary: SplitSummary;
  participants: Participant[];
  items: Item[];
  receipts: Receipt[];
  globalCurrency: string;
}

const SmartSummaryItem = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <li className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
            {icon}
        </div>
        <div className="text-sm text-muted-foreground flex-1">{children}</div>
    </li>
);

const InfoDialog = ({ title, description, trigger }: { title: string, description: React.ReactNode, trigger: React.ReactNode }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {trigger}
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-4 text-left pt-2 text-sm text-foreground/80">
            {description}
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Got it</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
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

    const { roundingAdjustment, roundingOccurred, roundedItems } = summary;

    const pennyPerfectContent = React.useMemo(() => {
        if (roundingAdjustment && roundingAdjustment.amount !== 0) {
            const adjustmentVerb = roundingAdjustment.amount > 0 ? 'added to' : 'subtracted from';
            return `To ensure the total was exact, a final rounding adjustment of ${formatCurrency(Math.abs(roundingAdjustment.amount))} was ${adjustmentVerb} ${roundingAdjustment.participantName}'s share.`;
        }
        if (roundingOccurred) {
            return "To ensure totals were exact, minor rounding differences were automatically distributed across some shared items. This keeps the final bill penny-perfect.";
        }
        return "All items were split perfectly without any need for rounding adjustments. Your math was easy this time!";
    }, [summary, formatCurrency, roundingOccurred, roundingAdjustment]);


    const pennyPerfectDialogDescription = React.useMemo(() => {
        if (!roundingOccurred) return null;

        const introText = <p>This happens when splitting items or calculating percentage-based service charges where the cost doesn't divide perfectly into cents. The app handles these micro-adjustments automatically for you. The following items from your session required rounding:</p>;

        return (
            <>
                {introText}
                <ScrollArea className="mt-4 max-h-[200px] rounded-md border p-2 bg-muted/50">
                    <div className="space-y-3 p-2">
                        {roundedItems.length > 0 ? (
                            roundedItems.map((item, index) => (
                                <div key={index}>
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
                                </div>
                            ))
                        ) : (
                            <p className='text-xs text-muted-foreground'>Rounding was required for percentage-based service charges, not specific items.</p>
                        )}
                    </div>
                </ScrollArea>
                {roundingAdjustment && roundingAdjustment.amount !== 0 && (
                    <p className='mt-4'>A final adjustment of <strong>{formatCurrency(roundingAdjustment.amount)}</strong> was applied to <strong>{roundingAdjustment.participantName}</strong> to make the grand total exact.</p>
                )}
            </>
        );
    }, [roundingOccurred, roundedItems, roundingAdjustment, formatCurrency]);


    const fairnessMetric = React.useMemo(() => {
        if (!summary.total || participants.length < 2) {
            return "Fairness check not applicable.";
        }
        if (averageShare === 0) {
            return "Everyone's share is zero. Perfectly balanced!";
        }
        
        const deviations = summary.participantSummaries.map(p =>
            Math.abs(p.totalShare - averageShare)
        );
        
        const maxDeviation = Math.max(...deviations);
        const maxDeviationPercent = (maxDeviation / averageShare) * 100;
        
        if (maxDeviationPercent < 0.1) {
            return "The split is almost perfectly even. Excellent!";
        }

        return `All payers are within ±${maxDeviationPercent.toFixed(1)}% of an equal share. Nicely balanced!`;
    }, [summary, participants, averageShare]);


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
                <ul className="space-y-5">
                    <SmartSummaryItem icon={<Scale className="h-5 w-5" />}>
                       <div className="flex items-center gap-1">
                           <span><strong>Fairness Check:</strong> {fairnessMetric}</span>
                           <InfoDialog
                                title="Fairness Check Calculation"
                                description={fairnessInfoDescription}
                                trigger={
                                    <button
                                        className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle"
                                        aria-label="More information about fairness check"
                                    >
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                }
                           />
                       </div>
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <div className="flex items-center gap-1">
                           <span>
                                <strong>Penny Perfect:</strong>{' '}
                                {pennyPerfectContent}
                           </span>
                           {pennyPerfectDialogDescription && (
                               <InfoDialog
                                    title="Penny Perfect Breakdown"
                                    description={pennyPerfectDialogDescription}
                                    trigger={
                                        <button
                                            className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle"
                                            aria-label="More information about rounding adjustment"
                                        >
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    }
                               />
                           )}
                       </div>
                    </SmartSummaryItem>
                </ul>
            </CardContent>
        </Card>
    );
}
