"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface BillSplitSummaryProps {
  summary: {
    participantSummaries: {
      id: string;
      name: string;
      totalPaid: number;
      totalShare: number;
      balance: number;
    }[];
    total: number;
  };
}

export default function BillSplitSummary({ summary }: BillSplitSummaryProps) {
  const { globalCurrency } = useSelector((state: RootState) => state.session);
  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  return (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {summary.participantSummaries.map(p => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.totalShare)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.totalPaid)}</TableCell>
                        <TableCell className={cn("text-right font-semibold flex justify-end items-center gap-1", p.balance < 0 ? 'text-destructive' : 'text-green-600')}>
                            {p.balance < 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                            {formatCurrency(Math.abs(p.balance))}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(summary.total)}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    </div>
  );
}
