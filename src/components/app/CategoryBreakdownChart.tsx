
'use client';

import React, { useMemo, useState } from 'react';
import { type Item, type Participant, type SplitSummary } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { type ChartConfig } from '@/components/ui/chart';

interface CategoryBreakdownChartProps {
  items: Item[];
  participants: Participant[];
  summary: SplitSummary;
  globalCurrency: string;
}

const CATEGORIES_ORDER: (Item['category'])[] = ['Food', 'Drink', 'Other'];

const getCategoryEmoji = (category: Item['category'] | string): string | null => {
    switch (category) {
        case 'Food': return '🍕';
        case 'Drink': return '🍺';
        case 'Other': return '🛍️';
        default: return null;
    }
};

export default function CategoryBreakdownChart({ items, participants, summary, globalCurrency }: CategoryBreakdownChartProps) {
    const [selectedView, setSelectedView] = useState<'total' | string>('total');
    const itemsById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

    const categoryTotals = useMemo(() => {
        const totals: { [key: string]: { total: number, subCategories: { [key: string]: number } } } = {};
        
        CATEGORIES_ORDER.forEach(cat => {
            if (cat) totals[cat] = { total: 0, subCategories: {} };
        });

        if (selectedView === 'total') {
            // "Total Bill" view logic
            items.forEach(item => {
                const category = item.category || 'Other';
                const subCategory = item.subCategory || 'Uncategorized';
                const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
                const effectiveCost = item.cost - totalItemDiscount;

                if (effectiveCost > 0) {
                    if (!totals[category]) {
                        totals[category] = { total: 0, subCategories: {} };
                    }
                    totals[category].total += effectiveCost;
                    totals[category].subCategories[subCategory] = (totals[category].subCategories[subCategory] || 0) + effectiveCost;
                }
            });
        } else {
            // Personalized view logic
            const participantSummary = summary.participantSummaries.find(p => p.id === selectedView);
            if (participantSummary) {
                participantSummary.breakdown.items.forEach(breakdownEntry => {
                    if (!breakdownEntry.itemId) return;
                    const originalItem = itemsById.get(breakdownEntry.itemId);
                    if (originalItem) {
                        const category = originalItem.category || 'Other';
                        const subCategory = originalItem.subCategory || 'Uncategorized';
                        // The breakdown amount is the participant's exact share of this item.
                        const shareAmount = breakdownEntry.amount;

                        if (!totals[category]) {
                            totals[category] = { total: 0, subCategories: {} };
                        }
                        totals[category].total += shareAmount;
                        totals[category].subCategories[subCategory] = (totals[category].subCategories[subCategory] || 0) + shareAmount;
                    }
                });
            }
        }

        return Object.entries(totals)
          .map(([category, data]) => ({
            category,
            total: data.total,
            subCategories: Object.entries(data.subCategories)
              .map(([name, total]) => ({ name, total }))
              .sort((a, b) => b.total - a.total),
          }))
          .filter(c => c.total > 0)
          .sort((a, b) => CATEGORIES_ORDER.indexOf(a.category as any) - CATEGORIES_ORDER.indexOf(b.category as any));
    }, [items, selectedView, summary.participantSummaries, itemsById]);

    const chartConfig = {
        total: { label: 'Total' },
        Food: { label: 'Food', color: 'hsl(var(--chart-1))' },
        Drink: { label: 'Drink', color: 'hsl(var(--chart-2))' },
        Other: { label: 'Other', color: 'hsl(var(--chart-3))' },
    } satisfies ChartConfig;

    const grandTotal = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

    const renderTabs = () => (
        <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
                <TabsList>
                    <TabsTrigger value="total">Total Bill</TabsTrigger>
                    {participants.map(p => (
                        <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
                    ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </Tabs>
    );

    if (grandTotal === 0 && selectedView === 'total') {
        return (
            <Alert>
                <LayoutGrid className="h-4 w-4" />
                <AlertTitle>No Data Available</AlertTitle>
                <AlertDescription>
                    Spend data will appear here once items are added and categorized.
                </AlertDescription>
            </Alert>
        )
    }

    if (grandTotal === 0 && selectedView !== 'total') {
        const participantName = participants.find(p => p.id === selectedView)?.name || 'This participant';
        return (
            <div className="space-y-4">
                {renderTabs()}
                <Alert>
                    <LayoutGrid className="h-4 w-4" />
                    <AlertTitle>No Spending Data</AlertTitle>
                    <AlertDescription>
                        {participantName} has no items assigned to them.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {renderTabs()}
            <div className="space-y-2">
            {categoryTotals.map((cat, index) => {
                const percentage = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0;
                const color = chartConfig[cat.category as keyof typeof chartConfig]?.color || 'hsl(var(--primary))';
                
                return (
                <Collapsible
                    key={cat.category}
                    defaultOpen={index < 2}
                    className="rounded-lg border bg-card transition-colors data-[state=open]:bg-primary/10 data-[state=open]:border-primary/20"
                >
                    <CollapsibleTrigger className="group flex w-full flex-col gap-2 p-3 text-left">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-lg w-6 text-center">{getCategoryEmoji(cat.category)}</span>
                            <span className="font-semibold">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-mono font-medium">{formatCurrency(cat.total, globalCurrency)}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%`, backgroundColor: color }} 
                        />
                    </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="space-y-1.5 px-3 pb-3 pt-1 border-t border-inherit">
                            {cat.subCategories.length > 0 ? cat.subCategories.map(sub => (
                                <div key={sub.name} className="flex justify-between items-center text-sm text-muted-foreground pl-9">
                                    <span>{sub.name}</span>
                                    <span className="font-mono">{formatCurrency(sub.total, globalCurrency)}</span>
                                </div>
                            )) : (
                                <div className="pl-9 text-sm text-muted-foreground">No sub-categories found.</div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                )
            })}
            </div>
        </div>
    );
}
