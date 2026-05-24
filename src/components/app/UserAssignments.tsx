"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import {
  assignItemToUser,
  unassignItemFromUser,
  toggleAllAssignees,
  setItemSplitMode,
  setPercentageAssignment,
  setExactAssignment,
} from '@/lib/redux/slices/sessionSlice';
import { Input } from '../ui/input';
import { Check, Equal, Percent, Hash } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserAssignmentsProps {
  itemId: string;
}

const SPLIT_MODES = [
  { value: 'equal',      label: 'Equal',  shortLabel: '=', Icon: Equal   },
  { value: 'percentage', label: '% Split', shortLabel: '%', Icon: Percent },
  { value: 'exact',      label: 'Exact',  shortLabel: '#', Icon: Hash    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserAssignments({ itemId }: UserAssignmentsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { participants, items, receipts } = useSelector(
    (state: RootState) => state.session,
  );

  const item = items.find((i) => i.id === itemId);
  const receipt = receipts.find((r) => r.id === item?.receiptId);
  const currency = receipt?.currency || 'USD';
  const assignees = item?.assignees || [];
  const splitMode = item?.splitMode || 'equal';

  // Local state for exact-amount inputs (controlled + committed on blur)
  const [exactStrings, setExactStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item?.splitMode === 'exact' && item.assignees && item.exactAssignments) {
      const init: Record<string, string> = {};
      item.assignees.forEach((pid) => {
        const v = item.exactAssignments[pid];
        init[pid] = v ? (v / 100).toFixed(2) : '';
      });
      setExactStrings(init);
    }
  }, [item]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const itemCost = useMemo(() => {
    if (!item) return 0;
    return item.cost - (item.discounts || []).reduce((s, d) => s + d.amount, 0);
  }, [item]);

  const totalPercentage = useMemo(() => {
    if (!item?.percentageAssignments) return 0;
    return item.assignees.reduce(
      (s, pid) => s + (item.percentageAssignments[pid] || 0),
      0,
    );
  }, [item]);

  const totalExactAmount = useMemo(() => {
    if (!item?.exactAssignments) return 0;
    return item.assignees.reduce(
      (s, pid) => s + (item.exactAssignments[pid] || 0),
      0,
    );
  }, [item]);

  const shares = useMemo(() => {
    const result: Record<string, number> = {};
    if (!item || assignees.length === 0 || itemCost <= 0) return result;

    if (splitMode === 'equal') {
      const base = Math.floor(itemCost / assignees.length);
      let remainder = itemCost % assignees.length;
      const sorted = [...assignees].sort((a, b) => a.localeCompare(b));
      sorted.forEach((id) => { result[id] = base; });
      for (let i = 0; i < remainder; i++) result[sorted[i]] += 1;

    } else if (splitMode === 'percentage' && totalPercentage === 100) {
      let distributed = 0;
      const calc = assignees.map((id) => {
        const share = Math.round((itemCost * (item.percentageAssignments[id] || 0)) / 100);
        distributed += share;
        return { id, share };
      });
      let rem = itemCost - distributed;
      const sorted = calc.sort((a, b) => a.id.localeCompare(b.id));
      for (let i = 0; i < Math.abs(rem); i++) {
        sorted[i % sorted.length].share += rem > 0 ? 1 : -1;
      }
      sorted.forEach(({ id, share }) => { result[id] = share; });

    } else if (splitMode === 'exact' && totalExactAmount === itemCost) {
      assignees.forEach((pid) => { result[pid] = item.exactAssignments[pid] || 0; });
    }

    return result;
  }, [item, assignees, itemCost, splitMode, totalPercentage, totalExactAmount]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleAssignment = (participantId: string, checked: boolean) => {
    if (checked) dispatch(assignItemToUser({ itemId, participantId }));
    else dispatch(unassignItemFromUser({ itemId, participantId }));
  };

  const handleToggleAll = () => {
    dispatch(toggleAllAssignees({
      itemId,
      assignAll: assignees.length < participants.length,
    }));
  };

  const handleModeChange = (mode: 'equal' | 'percentage' | 'exact') => {
    dispatch(setItemSplitMode({ itemId, splitMode: mode }));
  };

  const handlePercentageChange = (participantId: string, value: string) => {
    if (value === '') {
      dispatch(setPercentageAssignment({ itemId, participantId, percentage: 0 }));
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const n = parseInt(value, 10);
    if (!isNaN(n)) {
      dispatch(setPercentageAssignment({
        itemId,
        participantId,
        percentage: Math.max(0, Math.min(100, n)),
      }));
    }
  };

  const handleExactChange = (participantId: string, value: string) => {
    if (/^(\d+\.?\d{0,2}|\d*\.?\d{0,2})$/.test(value) || value === '') {
      setExactStrings((prev) => ({ ...prev, [participantId]: value }));
    }
  };

  const handleExactBlur = (participantId: string) => {
    const cents = Math.round(parseFloat(exactStrings[participantId] || '') * 100) || 0;
    if (!isNaN(cents) && item?.exactAssignments[participantId] !== cents) {
      dispatch(setExactAssignment({ itemId, participantId, amount: cents }));
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!item) return null;

  const allAssigned = assignees.length === participants.length && participants.length > 0;
  const noneAssigned = assignees.length === 0;

  const percentRemaining = 100 - totalPercentage;
  const exactRemaining = itemCost - totalExactAmount;
  const percentIsValid = totalPercentage === 100;
  const exactIsValid = totalExactAmount === itemCost;
  const exactIsOver = totalExactAmount > itemCost;

  // Auto-fill: one unset → fill that person; multiple unset → distribute remaining equally
  const autoFill = useMemo(() => {
    if (splitMode !== 'percentage' || totalPercentage >= 100 || assignees.length === 0) return null;
    const unset = assignees.filter((pid) => !(item.percentageAssignments?.[pid] ?? 0));
    if (unset.length === 0) return null;
    const remaining = 100 - totalPercentage;
    if (unset.length === 1) {
      return { kind: 'single' as const, pid: unset[0], remaining };
    }
    // Distribute remaining % evenly across unset participants (floor + give extras to first)
    const base = Math.floor(remaining / unset.length);
    const extras = remaining % unset.length;
    return { kind: 'distribute' as const, pids: unset, base, extras, remaining };
  }, [splitMode, totalPercentage, assignees, item.percentageAssignments]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── Mode tabs + Select all ── */}
      <div className="flex items-center gap-2">
        {/* Segmented control */}
        <div className="flex flex-1 rounded-lg border bg-secondary/40 p-[3px] gap-[3px]">
          {SPLIT_MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleModeChange(value)}
              aria-pressed={splitMode === value}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all select-none',
                splitMode === value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Select / deselect all */}
        {participants.length > 0 && (
          <button
            type="button"
            onClick={handleToggleAll}
            className="shrink-0 text-xs font-medium text-primary hover:underline px-1 py-1"
          >
            {allAssigned ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* ── Participant list ── */}
      <div className="rounded-xl border overflow-hidden divide-y divide-border">
        {participants.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6 px-4">
            Add participants in Step 1 to assign items.
          </p>
        ) : (
          participants.map((p) => {
            const isAssigned = assignees.includes(p.id);
            const share = shares[p.id];

            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors',
                  !isAssigned && 'bg-secondary/20',
                )}
              >
                {/* Circular toggle — full touch target */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isAssigned}
                  aria-label={`${isAssigned ? 'Remove' : 'Add'} ${p.name}`}
                  onClick={() => toggleAssignment(p.id, !isAssigned)}
                  className={cn(
                    'h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
                    isAssigned
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 hover:border-muted-foreground',
                  )}
                >
                  {isAssigned && (
                    <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                  )}
                </button>

                {/* Name */}
                <span
                  className={cn(
                    'flex-1 text-sm font-medium min-w-0 truncate select-none',
                    !isAssigned && 'text-muted-foreground',
                  )}
                >
                  {p.name}
                </span>

                {/* Right side: input (if assigned) + share */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Percentage input */}
                  {splitMode === 'percentage' && isAssigned && (
                    <div className="relative w-16">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={item.percentageAssignments?.[p.id] || ''}
                        onChange={(e) => handlePercentageChange(p.id, e.target.value)}
                        className="h-9 pr-6 text-right text-sm font-mono"
                        placeholder="0"
                        aria-label={`Percentage for ${p.name}`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                        %
                      </span>
                    </div>
                  )}

                  {/* Exact amount input */}
                  {splitMode === 'exact' && isAssigned && (
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                        {currency}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={exactStrings[p.id] || ''}
                        onChange={(e) => handleExactChange(p.id, e.target.value)}
                        onBlur={() => handleExactBlur(p.id)}
                        className="h-9 pl-8 text-right text-sm font-mono"
                        placeholder="0.00"
                        aria-label={`Amount for ${p.name}`}
                      />
                    </div>
                  )}

                  {/* Calculated share */}
                  <span
                    className={cn(
                      'font-mono text-sm tabular-nums text-right',
                      share ? 'text-foreground' : 'text-muted-foreground/30',
                      splitMode === 'equal' ? 'w-16' : 'w-0 overflow-hidden opacity-0',
                    )}
                  >
                    {share ? formatCurrency(share, currency) : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── % progress strip ── */}
      {splitMode === 'percentage' && assignees.length > 0 && (
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {percentIsValid
                ? 'Fully allocated'
                : totalPercentage > 100
                ? `${totalPercentage - 100}% over`
                : `${percentRemaining}% remaining`}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                percentIsValid
                  ? 'text-green-600 dark:text-green-400'
                  : totalPercentage > 100
                  ? 'text-destructive'
                  : 'text-foreground',
              )}
            >
              {totalPercentage}%
              {percentIsValid && ' ✓'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                percentIsValid
                  ? 'bg-green-500'
                  : totalPercentage > 100
                  ? 'bg-destructive'
                  : 'bg-primary',
              )}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>

          {/* Auto-fill button */}
          {autoFill && (
            <button
              type="button"
              onClick={() => {
                if (autoFill.kind === 'single') {
                  dispatch(setPercentageAssignment({
                    itemId,
                    participantId: autoFill.pid,
                    percentage: autoFill.remaining,
                  }));
                } else {
                  autoFill.pids.forEach((pid, i) => {
                    dispatch(setPercentageAssignment({
                      itemId,
                      participantId: pid,
                      percentage: autoFill.base + (i < autoFill.extras ? 1 : 0),
                    }));
                  });
                }
              }}
              className={cn(
                'w-full flex items-center justify-between gap-2',
                'rounded-lg border border-primary/30 bg-primary/5 px-3 py-2',
                'text-sm font-medium text-primary',
                'hover:bg-primary/10 active:bg-primary/15 transition-colors',
              )}
            >
              <span className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 shrink-0" />
                {autoFill.kind === 'single'
                  ? `Fill ${participants.find((p) => p.id === autoFill.pid)?.name}`
                  : `Distribute ${autoFill.remaining}% equally`}
              </span>
              <span className="font-mono text-xs bg-primary/10 rounded px-1.5 py-0.5">
                {autoFill.kind === 'single'
                  ? `→ ${autoFill.remaining}%`
                  : `÷ ${autoFill.pids.length}`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Exact balance strip ── */}
      {splitMode === 'exact' && assignees.length > 0 && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
            exactIsValid
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : exactIsOver
              ? 'bg-destructive/10 text-destructive'
              : 'bg-secondary',
          )}
        >
          {exactIsValid ? (
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4" />
              Balanced — {formatCurrency(itemCost, currency)}
            </span>
          ) : (
            <>
              <span className="text-muted-foreground">
                {exactIsOver ? 'Over by' : 'Remaining'}
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {formatCurrency(Math.abs(exactRemaining), currency)}
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Unassigned nudge (equal mode only) ── */}
      {splitMode === 'equal' && noneAssigned && participants.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Tap a name above to assign this item.
        </p>
      )}
    </div>
  );
}
