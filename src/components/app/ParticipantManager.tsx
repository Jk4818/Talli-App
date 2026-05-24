"use client";

import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { addParticipant, removeParticipant } from '@/lib/redux/slices/sessionSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, UserPlus, UserRoundPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLOURS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
];

export default function ParticipantManager() {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { participants } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const openForm = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(addParticipant(trimmed));
    setName('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBlur = () => {
    if (!name.trim()) setIsAdding(false);
  };

  const isEmpty = participants.length === 0;

  // ── Empty state: just the input, no strip ────────────────────────────────
  if (isEmpty) {
    return (
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Who's splitting? Add a name…"
          aria-label="New participant name"
          className="flex-1 h-12 text-base"
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="h-12 w-12 shrink-0"
          aria-label="Add participant"
          disabled={!name.trim()}
        >
          <UserPlus className="h-5 w-5" />
        </Button>
      </form>
    );
  }

  // ── Strip + add form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Horizontal avatar strip ────────────────────────────────────────
          Each column: avatar circle (56px) with × badge, name below.
          This is the standard mobile contact-chip pattern — scales to 10+
          people without growing the page height.
      ──────────────────────────────────────────────────────────────────── */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-0.5 pb-2 pt-1">
          <AnimatePresence initial={false}>
            {participants.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="shrink-0 flex flex-col items-center gap-1.5 w-16"
              >
                {/* Avatar + × badge */}
                <div className="relative">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className={`text-sm font-semibold ${AVATAR_COLOURS[i % AVATAR_COLOURS.length]}`}>
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => dispatch(removeParticipant(p.id))}
                    aria-label={`Remove ${p.name}`}
                    className="absolute -top-1 -right-1 h-[22px] w-[22px] rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive active:scale-90 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Name */}
                <span className="text-xs font-medium text-center w-full truncate leading-tight px-0.5">
                  {p.name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* ── Add form (collapsible) ─────────────────────────────────────────
          Collapsed  → full-width "Add person" button (44px min-height)
          Expanded   → input + submit button, blur-to-collapse if empty
      ──────────────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false} mode="wait">
        {isAdding ? (
          <motion.form
            key="form"
            onSubmit={handleAdd}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add another person…"
              aria-label="New participant name"
              className="flex-1 h-12 text-base"
              onBlur={handleBlur}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0"
              aria-label="Add participant"
              disabled={!name.trim()}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </motion.form>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            onClick={openForm}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
          >
            <UserRoundPlus className="h-4 w-4" />
            Add person
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
