"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

interface SharePieChartProps {
  summary: {
    participantSummaries: {
      name: string;
      totalShare: number;
    }[];
  };
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

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-square">
        <ResponsiveContainer width="100%" height={300}>
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
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
