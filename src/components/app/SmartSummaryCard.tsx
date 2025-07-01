'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant, Item, Receipt, ParticipantSummary } from '@/lib/types';
import { Lightbulb, Scale, Sparkles, Info, Trophy, Gem, Pizza, Bot, Award, HeartHandshake } from 'lucide-react';
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
        <div className="text-sm flex-1 space-y-0.5">{children}</div>
    </li>
);

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

    const pennyPerfectContent = React.useMemo(() => {
        if (roundingAdjustment && roundingAdjustment.amount !== 0) {
            const adjustmentVerb = roundingAdjustment.amount > 0 ? 'added to' : 'subtracted from';
            return `To ensure the total was exact, a final rounding adjustment of ${formatCurrency(Math.abs(roundingAdjustment.amount))} was ${adjustmentVerb} ${roundingAdjustment.participantName}'s share.`;
        }
        if (roundedItems.length > 0) {
            return "To ensure totals were exact, minor rounding differences were automatically distributed across some shared items. This keeps the final bill penny-perfect.";
        }
        return "All items were split perfectly without any need for rounding adjustments. Your math was easy this time!";
    }, [summary, formatCurrency, roundedItems, roundingAdjustment]);


    const pennyPerfectDialogDescription = React.useMemo(() => {
        if (roundedItems.length === 0) {
             return <p>All items in this session were split perfectly without any need for rounding adjustments.</p>
        }

        const introText = <p>This happens when an item's cost doesn't divide perfectly into cents among the sharers. The app distributes these extra pennies one by one to ensure fairness. The following items from your session required this kind of adjustment:</p>;

        return (
            <>
                {introText}
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
                {roundingAdjustment && roundingAdjustment.amount !== 0 && (
                     <p className='mt-4'>After all items were calculated, a final session-wide adjustment of <strong>{formatCurrency(Math.abs(roundingAdjustment.amount))}</strong> was {roundingAdjustment.amount > 0 ? 'added to' : 'subtracted from'} <strong>{roundingAdjustment.participantName}'s</strong> share to make the grand total exact.</p>
                )}
            </>
        );
    }, [roundedItems, roundingAdjustment, formatCurrency]);


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


    const highestPayer = React.useMemo(() => {
      if (!summary.participantSummaries || summary.participantSummaries.length === 0) return null;
      return summary.participantSummaries.reduce((max, p) => (p.totalPaid > max.totalPaid ? p : max), summary.participantSummaries[0]);
    }, [summary.participantSummaries]);

    const highestShare = React.useMemo(() => {
        if (!summary.participantSummaries || summary.participantSummaries.length === 0) return null;
        return summary.participantSummaries.reduce((max, p) => (p.totalShare > max.totalShare ? p : max), summary.participantSummaries[0]);
    }, [summary.participantSummaries]);

    const mostExpensiveItem = React.useMemo(() => {
        if (items.length === 0) return null;
        const itemsWithCost = items.filter(i => i.cost > 0);
        if (itemsWithCost.length === 0) return null;
        return itemsWithCost.reduce((max, item) => (item.cost > max.cost ? item : max), itemsWithCost[0]);
    }, [items]);
    
    const aiConfidence = React.useMemo(() => {
        const receiptsWithConfidence = receipts.filter(r => r.overallConfidence !== undefined && r.status === 'processed');
        if (receiptsWithConfidence.length === 0) {
            return null;
        }
        const totalConfidence = receiptsWithConfidence.reduce((sum, r) => sum + r.overallConfidence!, 0);
        const averageConfidence = totalConfidence / receiptsWithConfidence.length;
        return Math.round(averageConfidence);
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
        if (participants.length < 1 || summary.participantSummaries.length === 0) {
            return null;
        }

        // Find the participant with the highest total savings from discounts.
        const topSaverParticipant = summary.participantSummaries.reduce(
            (max, p) => {
                const maxSavings = Math.abs(max.breakdown.discounts.reduce((sum, d) => sum + d.amount, 0));
                const currentSavings = Math.abs(p.breakdown.discounts.reduce((sum, d) => sum + d.amount, 0));
                return currentSavings > maxSavings ? p : max;
            }
        );

        // Calculate the savings for the top saver.
        const maxSavings = Math.abs(topSaverParticipant.breakdown.discounts.reduce((sum, d) => sum + d.amount, 0));

        if (maxSavings > 0) {
            return {
                name: topSaverParticipant.name,
                amount: maxSavings,
            };
        }

        return null;
    }, [summary.participantSummaries, participants]);


    const socialButterfly = React.useMemo(() => {
        if (participants.length < 2) return null;

        const sharedWithMap = new Map<string, Set<string>>();
        participants.forEach(p => sharedWithMap.set(p.id, new Set()));

        items.forEach(item => {
            if (item.assignees.length > 1) {
                item.assignees.forEach(assigneeId => {
                    const sharerSet = sharedWithMap.get(assigneeId);
                    if (sharerSet) {
                        item.assignees.forEach(otherAssigneeId => {
                            if (assigneeId !== otherAssigneeId) {
                                sharerSet.add(otherAssigneeId);
                            }
                        });
                    }
                });
            }
        });

        let maxConnections = 0;
        let butterfly: Participant | null = null;

        participants.forEach(p => {
            const connections = sharedWithMap.get(p.id)?.size || 0;
            if (connections > maxConnections) {
                maxConnections = connections;
                butterfly = p;
            }
        });

        if (butterfly && maxConnections > 0) {
            return {
                name: butterfly.name,
                count: maxConnections,
            };
        }

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
                <ul className="space-y-6">
                    {aiConfidence !== null && (
                        <SmartSummaryItem icon={<Bot className="h-5 w-5" />}>
                            <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-foreground">AI Confidence</p>
                                <InfoDialog
                                    title="AI Confidence Breakdown"
                                    description={aiConfidenceDialogDescription}
                                    trigger={
                                        <button
                                            className="p-0 m-0 h-4 w-4 inline-flex items-center justify-center align-middle"
                                            aria-label="More information about AI confidence"
                                        >
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    }
                                />
                            </div>
                            <p className="text-muted-foreground">
                                On average, the AI was <span className="font-medium text-foreground">{aiConfidence}%</span> confident in its receipt scans.
                            </p>
                        </SmartSummaryItem>
                    )}
                    <SmartSummaryItem icon={<Scale className="h-5 w-5" />}>
                       <div className="flex items-center gap-1.5">
                           <p className="font-semibold text-foreground">Fairness Check</p>
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
                       <p className="text-muted-foreground">{fairnessMetric}</p>
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">Penny Perfect</p>
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
                       <p className="text-muted-foreground">{pennyPerfectContent}</p>
                    </SmartSummaryItem>
                    {topSaver && (
                        <SmartSummaryItem icon={<Award className="h-5 w-5" />}>
                            <p className="font-semibold text-foreground">Top Saver</p>
                            <p className="text-muted-foreground">
                                {topSaver.name} saved the most from discounts, totaling{' '}
                                <span className="font-medium text-foreground">{formatCurrency(topSaver.amount)}</span>.
                            </p>
                        </SmartSummaryItem>
                    )}
                    {socialButterfly && (
                        <SmartSummaryItem icon={<HeartHandshake className="h-5 w-5" />}>
                            <p className="font-semibold text-foreground">Social Butterfly</p>
                            <p className="text-muted-foreground">
                                {socialButterfly.name} shared items with {socialButterfly.count} other {socialButterfly.count === 1 ? 'person' : 'people'}, more than anyone else!
                            </p>
                        </SmartSummaryItem>
                    )}
                    {highestPayer && highestPayer.totalPaid > 0 && (
                        <SmartSummaryItem icon={<Trophy className="h-5 w-5" />}>
                            <p className="font-semibold text-foreground">Top Payer</p>
                            <p className="text-muted-foreground">
                                {highestPayer.name} contributed the most with{' '}
                                <span className="font-medium text-foreground">{formatCurrency(highestPayer.totalPaid)}</span>.
                            </p>
                        </SmartSummaryItem>
                    )}
                    {highestShare && highestShare.totalShare > 0 && (
                        <SmartSummaryItem icon={<Pizza className="h-5 w-5" />}>
                             <p className="font-semibold text-foreground">Highest Share</p>
                            <p className="text-muted-foreground">
                                {highestShare.name}'s portion of the bill was the largest at{' '}
                                <span className="font-medium text-foreground">{formatCurrency(highestShare.totalShare)}</span>.
                            </p>
                        </SmartSummaryItem>
                    )}
                    {mostExpensiveItem && (
                        <SmartSummaryItem icon={<Gem className="h-5 w-5" />}>
                             <p className="font-semibold text-foreground">Priciest Item</p>
                             <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">{formatCurrency(mostExpensiveItem.cost)}</span> for "{mostExpensiveItem.name}".
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                                {(() => {
                                    if (mostExpensiveItem.assignees.length === 0) {
                                        return "This item was unassigned.";
                                    } else if (mostExpensiveItem.assignees.length === 1) {
                                        const person = participants.find(p => p.id === mostExpensiveItem.assignees[0]);
                                        return `Claimed by ${person ? person.name : 'someone'}.`;
                                    } else {
                                        return `Shared between ${mostExpensiveItem.assignees.length} people.`;
                                    }
                                })()}
                            </p>
                        </SmartSummaryItem>
                    )}
                </ul>
            </CardContent>
        </Card>
    );
}
