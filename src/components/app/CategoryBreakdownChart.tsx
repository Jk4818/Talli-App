"use client";

import React from 'react';
import { type ChartConfig } from '@/components/ui/chart';
import { type Item } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface CategoryBreakdownChartProps {
  items: Item[];
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

export default function CategoryBreakdownChart({ items, globalCurrency }: CategoryBreakdownChartProps) {

  const categoryTotals = React.useMemo(() => {
    const totals: { [key: string]: { total: number, subCategories: { [key: string]: number } } } = {};
    
    CATEGORIES_ORDER.forEach(cat => {
        if (cat) totals[cat] = { total: 0, subCategories: {} };
    });

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
  }, [items]);

  const chartConfig = {
    total: { label: 'Total', color: 'hsl(var(--primary))' },
    Food: { label: 'Food', color: 'hsl(var(--chart-1))' },
    Drink: { label: 'Drink', color: 'hsl(var(--chart-2))' },
    Other: { label: 'Other', color: 'hsl(var(--chart-3))' },
  } satisfies ChartConfig;

  if (categoryTotals.length === 0) {
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

  const grandTotal = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-2">
      {categoryTotals.map((cat, index) => {
        const percentage = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0;
        const color = chartConfig[cat.category as keyof typeof chartConfig]?.color || chartConfig.total.color;
        
        return (
          <Collapsible key={cat.category} defaultOpen={index < 2}>
            <CollapsibleTrigger className="group flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 data-[state=open]:bg-accent/50">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{getCategoryEmoji(cat.category)}</span>
                      <span className="font-semibold">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <span className="font-mono font-medium">{formatCurrency(cat.total, globalCurrency)}</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
                <div className="space-y-1.5 px-3 py-2">
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
  );
}
