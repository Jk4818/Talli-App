'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { type SessionState } from '@/lib/types';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateSplits } from '@/lib/splitter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ReportSkeleton = () => (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-32" />
        </div>
        <Separator />
        <div>
            <Skeleton className="h-7 w-48 mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
            </div>
        </div>
        <Separator />
        <div className="space-y-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
    </div>
);


export default function ReportPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState('');

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('splitzy_report_session');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Basic validation
        if (parsedState && parsedState.participants && parsedState.items && parsedState.receipts) {
          setSession(parsedState);
        } else {
            throw new Error("Invalid session data found in storage.");
        }
      } else {
        throw new Error("No session data found. Please generate a report from the app's summary page.");
      }
    } catch (e) {
      console.error("Failed to load report session:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    }
    setDate(new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }));
  }, []);

  const summary = useMemo(() => {
    if (!session) return null;
    return calculateSplits(session);
  }, [session]);

  const participantMap = useMemo(() => {
    if (!session) return new Map();
    return new Map(session.participants.map(p => [p.id, p]));
  }, [session]);


  if (error) {
      return (
          <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-secondary/50">
              <div className="max-w-md w-full text-center">
                  <Logo />
                  <Alert variant="destructive" className="mt-8 text-left">
                      <AlertTitle>Could Not Load Report</AlertTitle>
                      <AlertDescription>
                          {error}
                      </AlertDescription>
                  </Alert>
                  <Button onClick={() => window.close()} className="mt-4">Close Tab</Button>
              </div>
          </div>
      )
  }

  if (!session || !summary) {
    return <ReportSkeleton />;
  }
  
  const { participants, items, receipts, globalCurrency } = session;

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
          .receipt-card, .settlement-section {
            break-inside: avoid;
          }
          .settlement-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid hsl(var(--border));
          }
        }
      `}</style>
      <div className="bg-secondary/40 font-body antialiased">
        <main className="max-w-2xl mx-auto p-4 sm:p-8 bg-background shadow-lg min-h-dvh">
            <div className="no-print p-4 mb-8 bg-primary/10 border-l-4 border-primary text-primary-foreground rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Printer className="h-5 w-5" />
                    <p className="font-medium">This is a print-friendly report.</p>
                </div>
                <Button onClick={() => window.print()}>
                    Save as PDF or Print
                </Button>
            </div>
            
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <Logo />
                <div className="text-sm text-muted-foreground text-left sm:text-right">
                    <p className="font-semibold text-lg text-foreground">Bill Summary</p>
                    <p>Report generated on {date}</p>
                </div>
            </header>

            <Separator className="my-6" />

            <section>
                <h2 className="text-xl font-headline font-bold mb-3">Participants</h2>
                <div className="flex flex-wrap gap-4">
                    {participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 text-xs">
                                <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{p.name}</span>
                        </div>
                    ))}
                </div>
            </section>
            
            <Separator className="my-6" />

            <section className="space-y-6">
                <h2 className="text-xl font-headline font-bold">Receipts</h2>
                {receipts.map(receipt => {
                    const receiptItems = items.filter(i => i.receiptId === receipt.id);
                    const payer = participants.find(p => p.id === receipt.payerId);

                    return (
                        <div key={receipt.id} className="receipt-card rounded-lg border bg-card/50 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold">{receipt.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">Paid by: {payer?.name || 'N/A'}</p>

                            {receipt.imageDataUri && (
                                <div className="my-4 border rounded-md overflow-hidden">
                                    <Image src={receipt.imageDataUri} alt={`Receipt for ${receipt.name}`} width={800} height={1000} className="w-full h-auto" />
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left font-medium p-2">Item</th>
                                            <th className="text-left font-medium p-2">Shared By</th>
                                            <th className="text-right font-medium p-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receiptItems.map(item => (
                                            <tr key={item.id} className="border-b last:border-none">
                                                <td className="p-2 align-top">{item.name}</td>
                                                <td className="p-2 align-top text-muted-foreground text-xs">
                                                    {item.assignees.map(pid => participantMap.get(pid)?.name || '').join(', ')}
                                                </td>
                                                <td className="p-2 align-top text-right font-mono">{formatCurrency(item.cost, receipt.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}
            </section>

            <section className="settlement-section">
                <h2 className="text-2xl font-headline font-bold mb-4">Final Settlement</h2>
                <div className="space-y-4">
                     <ul className="space-y-3">
                      {summary.settlements.length > 0 ? summary.settlements.map((s) => {
                        const fromParticipant = participants.find(p => p.name === s.from);
                        const toParticipant = participants.find(p => p.name === s.to);
                        return (
                          <li key={s.id} className="rounded-lg border bg-background p-4">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3 font-medium text-base">
                                  <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>{fromParticipant ? getInitials(fromParticipant.name) : '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{s.from}</span>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{s.to}</span>
                                  <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>{toParticipant ? getInitials(toParticipant.name) : '?'}</AvatarFallback>
                                  </Avatar>
                              </div>
                              <div className="flex items-center justify-end gap-4">
                                <span className='text-2xl font-bold text-primary'>
                                  {formatCurrency(s.amount, globalCurrency)}
                                </span>
                              </div>
                           </div>
                          </li>
                        )
                      }) : (
                          <p className="text-center text-muted-foreground py-4">All settled up! No payments needed.</p>
                      )}
                  </ul>
                  <div className="border-t-2 border-dashed pt-4 flex justify-between items-baseline">
                        <span className="text-xl font-bold">Grand Total</span>
                        <span className="text-2xl font-bold">{formatCurrency(summary.total, globalCurrency)}</span>
                  </div>
                </div>
            </section>
        </main>
      </div>
    </>
  );
}
