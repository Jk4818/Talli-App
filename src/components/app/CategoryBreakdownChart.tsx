
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

const CATEGORIES_ORDER: string[] = ['Food', 'Drink', 'Other', 'Service', 'Discounts'];

const getCategoryEmoji = (category: string): string | null => {
    switch (category) {
        case 'Food': return '🍕';
        case 'Drink': return '🍺';
        case 'Other': return '🛍️';
        case 'Service': return '🤝';
        case 'Discounts': return '🏷️';
        default: return null;
    }
};

export default function CategoryBreakdownChart({ items, participants, summary, globalCurrency }: CategoryBreakdownChartProps) {
    const [selectedView, setSelectedView] = useState<'total' | string>('total');
    const itemsById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

    const categoryTotals = useMemo(() => {
        const newTotals: { [key: string]: { total: number; subCategories: { [key: string]: number } } } = {};

        const addToTotals = (category: string, subCategory: string, amount: number) => {
            if (!newTotals[category]) {
                newTotals[category] = { total: 0, subCategories: {} };
            }
            if (!newTotals[category].subCategories[subCategory]) {
                newTotals[category].subCategories[subCategory] = 0;
            }
            newTotals[category].total += amount;
            newTotals[category].subCategories[subCategory] += amount;
        };

        const targetSummaries = selectedView === 'total' 
            ? summary.participantSummaries 
            : summary.participantSummaries.filter(p => p.id === selectedView);

        // Aggregate Items
        targetSummaries.forEach(pSummary => {
            pSummary.breakdown.items.forEach(entry => {
                const originalItem = itemsById.get(entry.itemId!);
                if (originalItem) {
                    addToTotals(originalItem.category || 'Other', originalItem.subCategory || 'Uncategorized', entry.amount);
                }
            });
        });

        // Aggregate Service Charges
        targetSummaries.forEach(pSummary => {
            pSummary.breakdown.serviceCharges.forEach(entry => {
                if (entry.amount > 0) {
                    addToTotals('Service', entry.description || 'Service Charge', entry.amount);
                }
            });
        });

        // Aggregate Discounts
        targetSummaries.forEach(pSummary => {
            pSummary.breakdown.discounts.forEach(entry => {
                if (entry.amount < 0) {
                    addToTotals('Discounts', entry.description || 'Discount', entry.amount);
                }
            });
        });

        return Object.entries(newTotals)
          .map(([category, data]) => ({
            category,
            total: data.total,
            subCategories: Object.entries(data.subCategories)
              .map(([name, total]) => ({ name, total }))
              .sort((a, b) => b.total - a.total),
          }))
          .filter(c => Math.abs(c.total) > 0.5) // Filter out zero or penny-rounding totals
          .sort((a, b) => {
                const aIndex = CATEGORIES_ORDER.indexOf(a.category);
                const bIndex = CATEGORIES_ORDER.indexOf(b.category);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
          });
    }, [itemsById, selectedView, summary.participantSummaries]);

    const chartConfig = {
        total: { label: 'Total', color: 'hsl(var(--primary))' },
        Food: { label: 'Food', color: 'hsl(var(--chart-1))' },
        Drink: { label: 'Drink', color: 'hsl(var(--chart-2))' },
        Other: { label: 'Other', color: 'hsl(var(--chart-3))' },
        Service: { label: 'Service', color: 'hsl(var(--chart-4))' },
        Discounts: { label: 'Discounts', color: 'hsl(var(--destructive))' },
    } satisfies ChartConfig;

    const grandTotal = categoryTotals
      .filter(c => c.total > 0)
      .reduce((sum, cat) => sum + cat.total, 0);

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

    if (grandTotal === 0 && selectedView === 'total' && categoryTotals.length === 0) {
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

    if (grandTotal === 0 && selectedView !== 'total' && categoryTotals.length === 0) {
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
                const isDiscount = cat.category === 'Discounts';
                const percentage = grandTotal > 0 && !isDiscount ? (cat.total / grandTotal) * 100 : 0;
                const color = chartConfig[cat.category as keyof typeof chartConfig]?.color || 'hsl(var(--primary))';
                
                return (
                <Collapsible
                    key={cat.category}
                    className="rounded-lg border bg-card transition-colors data-[state=open]:bg-primary/10 data-[state=open]:border-primary/20"
                >
                    <CollapsibleTrigger className="group flex w-full flex-col gap-2 p-3 text-left">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-lg w-6 text-center">{getCategoryEmoji(cat.category)}</span>
                                <span className="font-semibold">{cat.category}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={cn("font-mono font-medium", isDiscount && "text-destructive")}>
                                    {formatCurrency(cat.total, globalCurrency)}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                        </div>
                        {!isDiscount && (
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%`, backgroundColor: color }} 
                                />
                            </div>
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="space-y-1.5 px-3 pb-3 pt-1 border-t border-inherit">
                            {cat.subCategories.length > 0 ? cat.subCategories.map(sub => (
                                <div key={sub.name} className={cn("flex justify-between items-center text-sm text-muted-foreground pl-9", isDiscount && "text-destructive/90")}>
                                    <span className="break-words pr-2">{sub.name}</span>
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
