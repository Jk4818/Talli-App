
"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { SplitSummary } from '@/lib/types';

interface SharePieChartProps {
  summary: SplitSummary;
}

const COLORS = ['#A020F0', '#51C6CA', '#F0A020', '#20F0A0', '#F020A0', '#A0F020'];

const CustomTooltip = ({ active, payload, currency, total }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = data.value;
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        
        return (
            <div className="rounded-lg border bg-background/90 backdrop-blur-sm p-3 shadow-lg">
                <p className="font-bold text-foreground mb-1">{data.name}</p>
                <div className="space-y-1 text-sm">
                  <div className='flex justify-between items-center gap-4'>
                    <span className="text-muted-foreground">Share:</span>
                    <span className="font-medium">
                        {(value / 100).toLocaleString(undefined, { style: 'currency', currency: currency })}
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-4'>
                    <span className="text-muted-foreground">Percent:</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                </div>
            </div>
        );
    }
    return null;
};


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
              wrapperStyle={{ zIndex: 50 }}
              cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
              content={<CustomTooltip currency={globalCurrency} total={totalAmount} />}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%"
              innerRadius="60%"
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
            <p className="text-sm text-muted-foreground">Total / {summary.participantSummaries.length} People</p>
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
