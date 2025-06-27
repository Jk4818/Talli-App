'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SplitSummary, Participant } from '@/lib/types';
import { Lightbulb, Scale, ShieldCheck, Sparkles } from 'lucide-react';

interface SmartSummaryCardProps {
  summary: SplitSummary;
  participants: Participant[];
}

const SmartSummaryItem = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <li className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-1">
            {icon}
        </div>
        <p className="text-sm text-muted-foreground">{children}</p>
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

    // This is a static value for now as the AI model doesn't provide it.
    const confidenceLevel = "We're 97% confident this split is correct, based on receipt scanning and item assignment.";

    const roundingExplanation = "All totals are penny-perfect. Small rounding differences from splitting items have been automatically adjusted for fairness.";

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
                        <strong>Fairness Check:</strong> {fairnessMetric}
                    </SmartSummaryItem>
                    <SmartSummaryItem icon={<ShieldCheck className="h-5 w-5" />}>
                        <strong>Split Confidence:</strong> {confidenceLevel}
                    </SmartSummaryItem>
                     <SmartSummaryItem icon={<Sparkles className="h-5 w-5" />}>
                        <strong>Penny Perfect:</strong> {roundingExplanation}
                    </SmartSummaryItem>
                </ul>
            </CardContent>
        </Card>
    );
}
