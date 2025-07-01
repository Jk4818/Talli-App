
"use client";

import React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Item } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LayoutGrid } from 'lucide-react';

interface CategoryBreakdownChartProps {
  items: Item[];
  globalCurrency: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
const CATEGORIES: (Item['category'])[] = ['Food', 'Drink', 'Other'];

export default function CategoryBreakdownChart({ items, globalCurrency }: CategoryBreakdownChartProps) {

  const categoryTotals = React.useMemo(() => {
    const totals: { [key in Item['category'] & string]: number } = {
      Food: 0,
      Drink: 0,
      Other: 0,
    };

    items.forEach(item => {
        const category = item.category || 'Other';
        const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
        const effectiveCost = item.cost - totalItemDiscount;
        if (effectiveCost > 0) {
            totals[category] += effectiveCost;
        }
    });

    return totals;
  }, [items]);
  
  const chartData = CATEGORIES.map(category => ({
    category,
    total: categoryTotals[category] / 100, // convert to float for chart
  })).filter(d => d.total > 0);

  const chartConfig = {
    total: { label: 'Total', color: 'hsl(var(--chart-1))' },
    Food: { label: 'Food', color: 'hsl(var(--chart-1))' },
    Drink: { label: 'Drink', color: 'hsl(var(--chart-2))' },
    Other: { label: 'Other', color: 'hsl(var(--chart-3))' },
  } satisfies ChartConfig;

  if (chartData.length === 0) {
    return (
        <Alert>
            <LayoutGrid className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
                Spend data will appear here once items are added.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{
          left: 10,
        }}
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
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[CATEGORIES.indexOf(entry.category as any) % COLORS.length]} />
            ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
