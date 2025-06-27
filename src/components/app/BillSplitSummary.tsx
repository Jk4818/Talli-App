"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { SplitSummary, ParticipantSummary } from '@/lib/types';

interface BillSplitSummaryProps {
  summary: SplitSummary;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const ParticipantCard = ({ participant, currency }: { participant: ParticipantSummary, currency: string }) => {
    const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency });

    return (
        <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-lg">
            <div className={cn(
                "p-4 border-b-4",
                Math.abs(participant.balance) < 1 ? 'border-border' : participant.balance > 0 ? 'border-green-500' : 'border-destructive'
            )}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        <p className="text-lg font-semibold truncate">{participant.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-bold">{formatCurrency(Math.abs(participant.balance))}</p>
                        <p className={cn(
                            "text-sm font-medium",
                            Math.abs(participant.balance) < 1 ? 'text-muted-foreground' : participant.balance > 0 ? 'text-green-600' : 'text-destructive'
                        )}>
                            {Math.abs(participant.balance) < 1 ? 'Settled' : participant.balance > 0 ? 'Is owed' : 'Owes'}
                        </p>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 text-sm space-y-2 bg-muted/20">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Their Share</span>
                    <span className="font-mono">{formatCurrency(participant.totalShare)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">They Paid</span>
                    <span className="font-mono">{formatCurrency(participant.totalPaid)}</span>
                </div>
            </CardContent>
        </Card>
    );
};


export default function BillSplitSummary({ summary }: BillSplitSummaryProps) {
  const { globalCurrency } = useSelector((state: RootState) => state.session);
  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.participantSummaries.map(p => (
                <ParticipantCard key={p.id} participant={p} currency={globalCurrency} />
            ))}
        </div>
        <Card className="bg-card">
            <CardContent className="flex justify-between items-baseline p-4">
                <span className="text-xl font-bold">Grand Total</span>
                <span className="text-xl font-bold">{formatCurrency(summary.total)}</span>
            </CardContent>
        </Card>
    </div>
  );
}
