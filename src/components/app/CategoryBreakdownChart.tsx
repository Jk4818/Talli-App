
"use client";

import React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Item } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

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

  const chartData = categoryTotals.map(d => ({
    category: d.category,
    total: d.total / 100, // convert to float for chart
  }));

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

  return (
    <>
        <ChartContainer config={chartConfig} className="min-h-[100px] w-full">
            <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
            >
                <YAxis
                dataKey="category"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
                className="fill-muted-foreground text-xs"
                />
                <XAxis type="number" hide />
                <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
                content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value) * 100, globalCurrency)}
                    hideLabel
                />}
                />
                <Bar dataKey="total" layout="vertical" radius={5}>
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.category}`} fill={chartConfig[entry.category as keyof typeof chartConfig]?.color} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
        <Separator className="my-4" />
        <div className="space-y-2">
            <h4 className="font-medium text-sm">Detailed Breakdown</h4>
            {categoryTotals.map(cat => (
                <Collapsible key={cat.category} className="rounded-md border px-4">
                    <CollapsibleTrigger className="flex justify-between items-center w-full py-3 group">
                        <div className="flex items-center gap-3">
                            <span className="text-lg w-6 text-center">{getCategoryEmoji(cat.category)}</span>
                            <span className="font-semibold">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-mono font-medium">{formatCurrency(cat.total, globalCurrency)}</span>
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180")} />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pb-3 pl-5 space-y-1">
                            {cat.subCategories.map(sub => (
                                <div key={sub.name} className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{sub.name}</span>
                                    <span className="font-mono">{formatCurrency(sub.total, globalCurrency)}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    </>
  );
}
