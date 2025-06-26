"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { addParticipant, removeParticipant } from '@/lib/redux/slices/sessionSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, UserPlus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function ParticipantManager() {
  const [name, setName] = useState('');
  const { participants } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      dispatch(addParticipant(name.trim()));
      setName('');
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter participant's name"
          aria-label="New participant name"
        />
        <Button type="submit" size="icon" aria-label="Add participant">
          <UserPlus className="h-4 w-4" />
        </Button>
      </form>
      <div className="space-y-2">
        {participants.length > 0 ? (
          participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md p-2 bg-secondary/50">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.name}</span>
                </div>
              <Button variant="ghost" size="icon" onClick={() => dispatch(removeParticipant(p.id))} aria-label={`Remove ${p.name}`}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-center py-4 text-muted-foreground">No participants added yet.</p>
        )}
      </div>
    </div>
  );
}
