
"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { SplitSummary, ParticipantSummary } from '@/lib/types';

interface BillSplitSummaryProps {
  summary: SplitSummary;
}

// Shared across the settle section — keeps a person's colour consistent
// in both this component and the SharePieChart
export const PARTICIPANT_PALETTE: { bg: string; text: string; solid: string }[] = [
  { bg: 'rgba(168,85,247,0.16)',  text: '#A855F7', solid: '#A855F7' }, // Electric Violet
  { bg: 'rgba(34,211,238,0.16)',  text: '#22D3EE', solid: '#22D3EE' }, // Electric Cyan
  { bg: 'rgba(232,121,249,0.16)', text: '#E879F9', solid: '#E879F9' }, // Fuchsia
  { bg: 'rgba(251,191,36,0.16)',  text: '#FBBF24', solid: '#FBBF24' }, // Amber
  { bg: 'rgba(52,211,153,0.16)',  text: '#34D399', solid: '#34D399' }, // Emerald
  { bg: 'rgba(248,113,113,0.16)', text: '#F87171', solid: '#F87171' }, // Rose
];

export const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

interface ParticipantRowProps {
  participant: ParticipantSummary;
  currency: string;
  index: number;
}

const ParticipantRow = ({ participant, currency, index }: ParticipantRowProps) => {
  const fmt = (n: number) =>
    (n / 100).toLocaleString(undefined, { style: 'currency', currency });

  const isOwed    = participant.balance > 0;
  const owes      = participant.balance < 0;
  const isSettled = Math.abs(participant.balance) < 1;

  const palette = PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];

  const balanceDisplay = isSettled
    ? '—'
    : isOwed
    ? `+${fmt(participant.balance)}`
    : fmt(Math.abs(participant.balance));

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-secondary/60">
      {/* Avatar — accent-tinted, consistent with pie chart colour */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className="text-[11px] font-bold font-headline"
          style={{ backgroundColor: palette.bg, color: palette.text }}
        >
          {getInitials(participant.name)}
        </AvatarFallback>
      </Avatar>

      {/* Primary label + secondary detail — 14px / 12px hierarchy */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-headline text-foreground leading-tight truncate">
          {participant.name}
        </p>
        <p className="text-xs font-body text-muted-foreground mt-0.5 tabular-nums">
          Paid&nbsp;{fmt(participant.totalPaid)}
          <span className="mx-1 opacity-30">·</span>
          Share&nbsp;{fmt(participant.totalShare)}
        </p>
      </div>

      {/* Focal amount (16px) + status badge (10px) */}
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span
          className={cn(
            'text-base font-bold font-headline tabular-nums leading-none',
            isOwed    && 'text-success',
            owes      && 'text-destructive',
            isSettled && 'text-muted-foreground'
          )}
        >
          {balanceDisplay}
        </span>

        <span
          className={cn(
            'px-1.5 py-[2px] rounded-full text-[10px] font-semibold font-body uppercase tracking-[0.06em] leading-none',
            isOwed    && 'bg-success/15 text-success',
            owes      && 'bg-destructive/15 text-destructive',
            isSettled && 'bg-muted-foreground/15 text-muted-foreground'
          )}
        >
          {isSettled ? 'Even' : isOwed ? 'Owed' : 'Owes'}
        </span>
      </div>
    </div>
  );
};


export default function BillSplitSummary({ summary }: BillSplitSummaryProps) {
  const { globalCurrency } = useSelector((state: RootState) => state.session);
  const fmt = (n: number) =>
    (n / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  if (summary.participantSummaries.length === 0) return null;

  return (
    <div>
      {/* Zero-divider list — gap achieved through row padding only */}
      {summary.participantSummaries.map((p, i) => (
        <ParticipantRow
          key={p.id}
          participant={p}
          currency={globalCurrency}
          index={i}
        />
      ))}

      {/* Grand total footer — one tonal step above card surface */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/70 rounded-md mt-2">
        <span className="text-[10px] font-semibold font-body uppercase tracking-[0.06em] text-muted-foreground">
          Grand Total
        </span>
        <span className="text-[15px] font-bold font-headline tabular-nums text-primary">
          {fmt(summary.total)}
        </span>
      </div>
    </div>
  );
}
