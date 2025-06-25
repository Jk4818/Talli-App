
"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { SplitSummary, ParticipantSummary } from '@/lib/types';
import { Separator } from '../ui/separator';


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

    const isOwed = participant.balance > 0;
    const owes = participant.balance < 0;
    const isSettled = Math.abs(participant.balance) < 1;

    return (
        <Card className={cn(
            "overflow-hidden shadow-sm transition-shadow hover:shadow-md border-l-4",
            isOwed && "border-accent",
            owes && "border-destructive",
            isSettled && "border-border"
        )}>
            <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        <p className="text-lg font-semibold truncate font-headline">{participant.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-bold">{formatCurrency(Math.abs(participant.balance))}</p>
                        <p className={cn(
                            "text-sm font-medium",
                            isOwed && "text-accent-foreground",
                            owes && "text-destructive",
                            isSettled && "text-muted-foreground"
                        )}>
                            {isSettled ? 'Settled' : isOwed ? 'Is owed' : 'Owes'}
                        </p>
                    </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">They Paid</span>
                        <span className="font-medium">{formatCurrency(participant.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Their Share</span>
                        <span className="font-medium">{formatCurrency(participant.totalShare)}</span>
                    </div>
                </div>
            </div>
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
