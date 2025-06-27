'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant } from '@/lib/types';
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
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface SmartSummaryCardProps {
  summary: SplitSummary;
  participants: Participant[];
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


export default function SmartSummaryCard({ summary, participants, globalCurrency }: SmartSummaryCardProps) {
    const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

    const fairnessMetric = React.useMemo(() => {
        if (!summary.total || participants.length < 2) {
            return "Fairness check not applicable.";
        }
        const averageShare = summary.total / participants.length;
        if (averageShare === 0) {
            return "Everyone's share is zero. Perfectly balanced!";
        }
        
        const deviations = summary.participantSummaries.map(p =>
            Math.abs(p.totalShare - averageShare)
        );
        
        const maxDeviation = Math.max(...deviations);
        const maxDeviationPercent = (maxDeviation / averageShare) * 100;
        
        return `All payers are within ±${maxDeviationPercent.toFixed(1)}% of an equal share. Nicely balanced!`;
    }, [summary, participants]);

    const averageShare = participants.length > 0 ? summary.total / participants.length : 0;
    const { roundingAdjustment } = summary;

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
                        <strong>Fairness Check:</strong> {fairnessMetric}{' '}
                        <InfoDialog
                          title="Fairness Check Calculation"
                          description={fairnessInfoDescription}
                          trigger={
                            <Button
                                variant="link"
                                className="p-0 m-0 h-4 w-4 inline-flex align-middle"
                                aria-label="More information about fairness check"
                            >
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <strong>Penny Perfect:</strong>{' '}
                        {roundingAdjustment && roundingAdjustment.amount !== 0 ? (
                            `To ensure the total was exact, a final rounding adjustment of ${formatCurrency(roundingAdjustment.amount)} was made to ${roundingAdjustment.participantName}'s share.`
                        ) : (
                            'All items were split perfectly without any need for rounding adjustments. Your math was easy this time!'
                        )}
                    </SmartSummaryItem>
                </ul>
            </CardContent>
        </Card>
    );
}
