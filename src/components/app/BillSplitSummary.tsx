"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { SplitSummary } from '@/lib/types';

interface BillSplitSummaryProps {
  summary: SplitSummary;
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
                        <TableCell className="text-right font-semibold">
                            {Math.abs(p.balance) < 1 ? (
                                <span className='text-muted-foreground'>{formatCurrency(0)}</span>
                            ) : p.balance > 0 ? (
                                <span className="text-green-600">{formatCurrency(p.balance)} is owed</span>
                            ) : (
                                <span className="text-destructive">{formatCurrency(Math.abs(p.balance))} owes</span>
                            )}
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
