"use client";

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { calculateSplits } from '@/lib/splitter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import BillSplitSummary from './BillSplitSummary';
import SharePieChart from './SharePieChart';
import { Button } from '../ui/button';
import { resetSession } from '@/lib/redux/slices/sessionSlice';
import { HandCoins, Scale, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Step3Summary() {
  const sessionState = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const summary = useMemo(() => {
    if (sessionState.participants.length > 0 && sessionState.items.length > 0) {
      return calculateSplits(sessionState);
    }
    return { participantSummaries: [], settlements: [], total: 0 };
  }, [sessionState]);

  const handleStartNew = () => {
    dispatch(resetSession());
  };

  const handleSave = () => {
    console.log("Session Data:", sessionState);
    console.log("Calculated Summary:", summary);
    toast({
        title: "Session Saved!",
        description: "Your session data has been logged to the browser console."
    })
  };

  return (
    <div className="space-y-8">
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSave}>Save Session</Button>
            <Button onClick={handleStartNew}><RefreshCw className="mr-2 h-4 w-4" /> Start New Session</Button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <Scale className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Bill Breakdown</CardTitle>
                        <CardDescription>Final shares, payments, and balances for each participant.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <BillSplitSummary summary={summary} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <HandCoins className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Settlement Plan</CardTitle>
                        <CardDescription>The simplest way to settle up.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                <ul className="space-y-3">
                    {summary.settlements.length > 0 ? summary.settlements.map((s, i) => (
                    <li key={i} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                        <div className="font-medium">{s.from}</div>
                        <div className="flex items-center gap-2 text-primary font-semibold">
                        <span>&rarr;</span>
                        <span>
                            {(s.amount / 100).toLocaleString(undefined, { style: 'currency', currency: sessionState.globalCurrency })}
                        </span>
                        <span>&rarr;</span>
                        </div>
                        <div className="font-medium">{s.to}</div>
                    </li>
                    )) : (
                        <p className="text-center text-muted-foreground py-4">All settled up!</p>
                    )}
                </ul>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Total Shares</CardTitle>
              <CardDescription>How the total bill is divided.</CardDescription>
            </CardHeader>
            <CardContent>
              <SharePieChart summary={summary} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
