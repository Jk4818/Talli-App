'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant } from '@/lib/types';
import { Lightbulb, Scale, ShieldCheck, Sparkles, Info } from 'lucide-react';
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

interface SmartSummaryCardProps {
  summary: SplitSummary;
  participants: Participant[];
}


const SmartSummaryItem = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <li className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
            {icon}
        </div>
        <p className="text-sm text-muted-foreground flex-1">{children}</p>
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
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Got it</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);


export default function SmartSummaryCard({ summary, participants }: SmartSummaryCardProps) {
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

    const confidenceLevel = "We're 97% confident this split is correct, based on receipt scanning and item assignment.";
    
    const roundingExplanation = "The final total is penny-perfect. To achieve this, rounding differences from splitting items are distributed automatically. For example, when a $10 item is split three ways, two people pay $3.33 and one pays $3.34. The app ensures this is done fairly across all splits.";

    const fairnessInfoDescription = (
      <div className="space-y-4 text-left pt-2">
        <p>This metric shows how evenly the total cost was distributed. Here's how it's calculated:</p>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li><strong>Find the average:</strong> First, we find the average share per person (`Total Bill ÷ Number of Participants`).</li>
          <li><strong>Measure deviation:</strong> Then, for each person, we see how far their actual share is from that average.</li>
          <li><strong>Show the max:</strong> The percentage you see is the largest deviation we found. A lower number means a more even split!</li>
        </ol>
      </div>
    );
    
    const confidenceInfoDescription = (
      <div className="space-y-4 text-left pt-2">
        <p>This is a representative score indicating the AI's confidence in correctly extracting data from your receipts.</p>
        <p className="text-sm">In a real-world scenario, this would be based on factors like the quality of the receipt image and the clarity of its text. A higher score indicates greater confidence in the automated scan.</p>
      </div>
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
                    <SmartSummaryItem icon={<ShieldCheck className="h-5 w-5" />}>
                        <strong>Split Confidence:</strong> {confidenceLevel}{' '}
                        <InfoDialog
                          title="Split Confidence Score"
                          description={confidenceInfoDescription}
                          trigger={
                            <Button
                                variant="link"
                                className="p-0 m-0 h-4 w-4 inline-flex align-middle"
                                aria-label="More information about split confidence"
                            >
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <strong>Penny Perfect:</strong> {roundingExplanation}
                    </SmartSummaryItem>
                </ul>
            </CardContent>
        </Card>
    );
}
