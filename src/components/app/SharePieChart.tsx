
"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { SplitSummary } from '@/lib/types';
import { PARTICIPANT_PALETTE } from './BillSplitSummary';

interface SharePieChartProps {
  summary: SplitSummary;
}

export default function SharePieChart({ summary }: SharePieChartProps) {
  const { globalCurrency } = useSelector((state: RootState) => state.session);
  const fmt = (n: number) =>
    (n / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  const chartData = summary.participantSummaries
    .filter(p => p.totalShare > 0)
    .map((p, i) => ({
      name: p.name,
      value: p.totalShare,
      color: PARTICIPANT_PALETTE[i % PARTICIPANT_PALETTE.length].solid,
    }));

  const totalShares = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Compact donut — fixed 160×160, not aspect-square stretched full-width */}
      <div className="relative mx-auto" style={{ width: 164, height: 164 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={74}
              innerRadius={50}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre overlay — total + headcount, always visible */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center gap-0.5">
          <p className="text-[9px] font-semibold font-body uppercase tracking-[0.06em] text-muted-foreground">
            Total
          </p>
          <p className="text-lg font-bold font-headline tabular-nums text-foreground leading-none">
            {fmt(summary.total)}
          </p>
          <p className="text-[10px] font-body text-muted-foreground">
            {chartData.length} {chartData.length === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      {/* Per-person rows — all data visible without any interaction */}
      <div className="space-y-1">
        {chartData.map((entry) => {
          const pct = totalShares > 0 ? (entry.value / totalShares) * 100 : 0;
          return (
            <div key={entry.name} className="rounded-md px-3 py-2 bg-secondary/40">
              <div className="flex items-center gap-2.5">
                {/* Colour swatch matching the donut slice */}
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                {/* Name */}
                <span className="flex-1 min-w-0 text-sm font-semibold font-headline text-foreground truncate leading-none">
                  {entry.name}
                </span>
                {/* Amount — focal */}
                <span className="text-[13px] font-medium font-headline tabular-nums text-foreground shrink-0">
                  {fmt(entry.value)}
                </span>
                {/* Percentage — secondary */}
                <span className="text-[10px] font-body text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>

              {/* Thin proportion bar */}
              <div className="mt-1.5 h-[2px] rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: entry.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
