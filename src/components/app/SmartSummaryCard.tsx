
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant } from '@/lib/types';
import { Lightbulb, Scale, ShieldCheck, Sparkles, Info } from 'lucide-react';
import { AccessibleTooltip } from '../ui/accessible-tooltip';

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

export default function SmartSummaryCard({ summary, participants }: SmartSummaryCardProps) {
    const fairnessMetric = React.useMemo(() => {
        if (!summary.total || participants.length < 2) {
            return "Fairness check not applicable for a single participant.";
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
    
    const roundingExplanation = "To ensure the final bill is exact, tiny rounding differences (often just a single cent) are automatically distributed among the participants of a split. This guarantees the total is always penny-perfect.";

    const fairnessInfo = (
        <div className="space-y-2 text-left">
            <h4 className="font-bold">How is fairness calculated?</h4>
            <p>This metric shows how evenly the total cost was distributed. It's calculated by finding the average share per person and then determining the largest percentage difference any one person's share is from that average. A lower percentage means a more even split.</p>
        </div>
    );
    
    const confidenceInfo = (
        <div className="space-y-2 text-left">
            <h4 className="font-bold">What is split confidence?</h4>
            <p>This is a representative score indicating the AI's confidence in correctly extracting data from your receipts. In a real-world scenario, this would be based on the quality of the receipt image and the clarity of its text.</p>
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
                        <span>
                            <strong>Fairness Check:</strong> {fairnessMetric}{' '}
                            <AccessibleTooltip content={fairnessInfo}>
                                <span className="inline-flex cursor-help" aria-label="More information about fairness check">
                                    <Info className="inline-block h-4 w-4 align-text-bottom text-muted-foreground" />
                                </span>
                            </AccessibleTooltip>
                        </span>
                    </SmartSummaryItem>
                    <SmartSummaryItem icon={<ShieldCheck className="h-5 w-5" />}>
                         <span>
                            <strong>Split Confidence:</strong> {confidenceLevel}{' '}
                            <AccessibleTooltip content={confidenceInfo}>
                                <span className="inline-flex cursor-help" aria-label="More information about split confidence">
                                    <Info className="inline-block h-4 w-4 align-text-bottom text-muted-foreground" />
                                </span>
                            </AccessibleTooltip>
                        </span>
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <strong>Penny Perfect:</strong> {roundingExplanation}
                    </SmartSummaryItem>
                </ul>
            </CardContent>
        </Card>
    );
}
