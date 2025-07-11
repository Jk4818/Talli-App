
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from '@/lib/redux/slices/sessionSlice';
import { type AppDispatch, type RootState } from '@/lib/redux/store';
import { type SessionState, type ParticipantSummary, type BreakdownEntry, type Item } from '@/lib/types';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateSplits } from '@/lib/splitter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        <Separator className="my-6" />
        <div className="space-y-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
    </div>
);


const BreakdownCard = ({ participant, currency }: { participant: ParticipantSummary, currency: string }) => {
    const hasBreakdown = participant.breakdown.items.length > 0 || participant.breakdown.discounts.length > 0 || participant.breakdown.serviceCharges.length > 0;
    
    return (
        <div className="break-inside-avoid">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 text-base">
                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-headline text-lg font-semibold">{participant.name}</h4>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Paid:</span>
                            <span className="font-medium">{formatCurrency(participant.totalPaid, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Share:</span>
                            <span className="font-medium">{formatCurrency(participant.totalShare, currency)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-base">
                            <span>Balance:</span>
                            <span className={cn(
                                participant.balance > 0 && "text-accent-foreground",
                                participant.balance < 0 && "text-destructive"
                            )}>
                                {formatCurrency(Math.abs(participant.balance), currency)}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                    {participant.balance > 0 ? 'is owed' : participant.balance < 0 ? 'owes' : 'settled'}
                                </span>
                            </span>
                        </div>
                    </div>

                    {hasBreakdown && (
                        <>
                            <Separator className="my-4" />
                            <h5 className="text-sm font-semibold mb-2">Itemized Share</h5>
                            <div className="space-y-2 rounded-md border p-2 text-xs">
                                <div className="grid grid-cols-2 gap-1 font-semibold">
                                    <span>Description</span>
                                    <span className="text-right">Your Share</span>
                                </div>
                                <Separator />
                                {participant.breakdown.items.map((item, i) => (
                                    <div key={`item-${i}`} className="grid grid-cols-2 gap-1">
                                        <span className="break-words">{item.description}</span>
                                        <span className="text-right font-mono">{formatCurrency(item.amount, currency)}</span>
                                    </div>
                                ))}
                                {participant.breakdown.discounts.map((disc, i) => (
                                    <div key={`disc-${i}`} className="grid grid-cols-2 gap-1 text-destructive">
                                        <span className="break-words pl-2">↳ {disc.description}</span>
                                        <span className="text-right font-mono">{formatCurrency(disc.amount, currency)}</span>
                                    </div>
                                ))}
                                {participant.breakdown.serviceCharges.map((sc, i) => (
                                    <div key={`sc-${i}`} className="grid grid-cols-2 gap-1">
                                        <span className="break-words">{sc.description}</span>
                                        <span className="text-right font-mono">{formatCurrency(sc.amount, currency)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function ReportPage() {
  const dispatch = useDispatch<AppDispatch>();
  const sessionState = useSelector((state: RootState) => state.session);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState('');

  useEffect(() => {
    const sessionKey = 'splitzy_report_session';
    try {
      const savedState = sessionStorage.getItem(sessionKey);
      if (savedState) {
        // Once we read the data, we remove it to ensure refreshing the page
        // doesn't show stale data. This makes the report truly ephemeral.
        sessionStorage.removeItem(sessionKey);

        const parsedState = JSON.parse(savedState) as Partial<SessionState>;
        // Basic validation
        if (parsedState && parsedState.participants && parsedState.items && parsedState.receipts) {
          dispatch(restoreSession(parsedState));
        } else {
          setError("Invalid session data found in storage.");
        }
      } else {
        setError("No session data found. Please generate a report from the app's summary page.");
      }
    } catch (e) {
      // This will catch errors from JSON.parse
      console.error('Failed to load report session:', e)
      setError(e instanceof Error ? e.message : "An unknown error occurred while loading the report.");
    } finally {
        setIsLoading(false);
    }

    setDate(new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }));
  }, [dispatch]);

  const summary = useMemo(() => {
    if (sessionState.participants.length === 0) return null;
    return calculateSplits(sessionState);
  }, [sessionState]);

  const participantMap = useMemo(() => {
    if (sessionState.participants.length === 0) return new Map();
    return new Map(sessionState.participants.map(p => [p.id, p]));
  }, [sessionState.participants]);

  const getShareDetails = (item: Item) => {
    if (sessionState.participants.length === 0) return '';
    const assignees = item.assignees.map(pid => participantMap.get(pid)?.name || '?');
    if (assignees.length === 0) return 'Unassigned';

    switch (item.splitMode) {
        case 'equal':
            return `Equally by ${assignees.join(', ')}`;
        case 'percentage':
            const details = item.assignees.map(pid => {
                const name = participantMap.get(pid)?.name || '?';
                const percent = item.percentageAssignments[pid] || 0;
                return `${name} (${percent}%)`;
            }).join(', ');
            return `By percentage: ${details}`;
        case 'exact':
            const receipt = sessionState.receipts.find(r => r.id === item.receiptId);
            const currency = receipt?.currency || 'USD';
            const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
            const effectiveCost = item.cost - totalItemDiscount;

            const exactDetails = item.assignees.map(pid => {
                const name = participantMap.get(pid)?.name || '?';
                const amount = item.exactAssignments[pid] || 0;
                return `${name} (${formatCurrency(amount, currency)})`;
            }).join(', ');
            return `By exact amount: ${exactDetails}`;
        default:
            return assignees.join(', ');
    }
  };

  if (isLoading) {
      return <ReportSkeleton />;
  }

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
                  <Button asChild className="mt-4">
                    <Link href="/">Back to Home</Link>
                  </Button>
              </div>
          </div>
      )
  }

  if (!summary) {
    return <ReportSkeleton />;
  }
  
  const { participants, items, receipts, globalCurrency } = sessionState;

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
          .report-section, .receipt-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="bg-secondary/40 font-body antialiased">
        <main className="max-w-2xl mx-auto p-4 sm:p-8 bg-background shadow-lg min-h-dvh">
            <Alert className="no-print mb-8">
                <Printer className="h-4 w-4" />
                <AlertTitle>This is a print-friendly report.</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-2">
                    <p>Use your browser's print function (Ctrl/Cmd + P) to save as a PDF.</p>
                    <Button onClick={() => window.print()} size="sm" className="w-full sm:w-auto">
                        Save or Print
                    </Button>
                </AlertDescription>
            </Alert>
            
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <Logo />
                <div className="text-sm text-muted-foreground text-left sm:text-right">
                    <p className="font-semibold text-lg text-foreground">Bill Summary</p>
                    <p>Report generated on {date}</p>
                </div>
            </header>

            <Separator className="my-6" />

            <section className="report-section">
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

            <section className="space-y-6 report-section">
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
                                            <th className="text-center font-medium p-2">Qty</th>
                                            <th className="text-left font-medium p-2">Split Details</th>
                                            <th className="text-right font-medium p-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receiptItems.map(item => (
                                            <tr key={item.id} className="border-b last:border-none">
                                                <td className="p-2 align-top break-words">
                                                  {item.name}
                                                  {(item.discounts || []).map(d => (
                                                    <div key={d.id} className='text-xs text-destructive'>↳ {d.name} ({formatCurrency(-d.amount, receipt.currency)})</div>
                                                  ))}
                                                </td>
                                                <td className="p-2 align-top text-center">{item.quantity}</td>
                                                <td className="p-2 align-top text-muted-foreground text-xs break-words">
                                                    {getShareDetails(item)}
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

            <Separator className="my-6" />

            <section className="report-section">
                <h2 className="text-xl font-headline font-bold mb-4">Participant Summaries</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {summary.participantSummaries.map((p) => (
                        <BreakdownCard key={p.id} participant={p} currency={globalCurrency} />
                    ))}
                </div>
            </section>

            <Separator className="my-6" />

            <section className="report-section">
                <h2 className="text-2xl font-headline font-bold mb-4">Final Settlement</h2>
                <div className="space-y-4">
                     <ul className="space-y-3">
                      {summary.settlements.length > 0 ? summary.settlements.map((s) => {
                        const fromParticipant = participants.find(p => p.name === s.from);
                        const toParticipant = participants.find(p => p.name === s.to);
                        return (
                          <li key={s.id} className="rounded-lg border bg-background p-4">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex flex-1 min-w-0 items-center gap-3 font-medium text-base">
                                  <Avatar className="h-8 w-8 text-xs shrink-0">
                                    <AvatarFallback>{fromParticipant ? getInitials(fromParticipant.name) : '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 min-w-0 truncate">{s.from}</span>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <span className="flex-1 min-w-0 truncate">{s.to}</span>
                                  <Avatar className="h-8 w-8 text-xs shrink-0">
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
