"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { SplitSummary } from '@/lib/types';

interface SharePieChartProps {
  summary: SplitSummary;
}

const COLORS = ['#A020F0', '#20A0F0', '#F0A020', '#20F0A0', '#F020A0', '#A0F020'];

export default function SharePieChart({ summary }: SharePieChartProps) {
  const { globalCurrency } = useSelector((state: RootState) => state.session);

  const chartData = summary.participantSummaries.filter(p => p.totalShare > 0).map(p => ({
    name: p.name,
    value: p.totalShare,
  }));
  
  const chartConfig = chartData.reduce((acc, data, index) => {
    acc[data.name] = {
      label: data.name,
      color: COLORS[index % COLORS.length]
    };
    return acc;
  }, {} as ChartConfig);

  const legendData = chartData.map((entry, index) => ({
    name: entry.name,
    color: COLORS[index % COLORS.length],
  }));

  const totalAmount = summary.total;

  return (
    <div className='flex flex-col items-center w-full'>
      <div className="relative w-full max-w-[300px] aspect-square">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value) => (Number(value) / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency })}
                nameKey="name"
              />}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%" // Responsive radius
              innerRadius="60%" // Responsive radius
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <p className="text-sm text-muted-foreground">Total Bill</p>
            <p className="text-2xl sm:text-3xl font-bold font-headline">
                {(totalAmount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency })}
            </p>
        </div>
      </div>
      
      <div className="mt-4 w-full">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {legendData.map((entry, index) => (
            <li key={`item-${index}`} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
