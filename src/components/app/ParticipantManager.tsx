
"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { addParticipant, removeParticipant } from '@/lib/redux/slices/sessionSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

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
    <div className="space-y-4 h-full flex flex-col">
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
      
      {/* Mobile & Tablet: Horizontal Scrolling Cards */}
      <div className="lg:hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-3 pt-3 pb-4 pr-3">
            {participants.length > 0 ? (
              participants.map((p) => (
                <div key={p.id} className="relative group flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/80 w-24 h-24">
                  <Avatar className="h-10 w-10 text-base mb-2">
                      <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-center w-full truncate" title={p.name}>{p.name}</span>
                  <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 translate-x-1/2" 
                      onClick={() => dispatch(removeParticipant(p.id))} 
                      aria-label={`Remove ${p.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="w-full">
                <p className="text-sm text-center py-4 text-muted-foreground">No participants added yet.</p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop: Vertical List */}
      <div className="hidden lg:block flex-1 min-h-0">
        <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
                {participants.length > 0 ? (
                    participants.map((p) => (
                        <div key={p.id} className="group flex items-center p-2 rounded-md hover:bg-secondary/80">
                            <Avatar className="h-8 w-8 text-xs mr-3">
                                <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm flex-1 truncate" title={p.name}>{p.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => dispatch(removeParticipant(p.id))}
                                aria-label={`Remove ${p.name}`}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center py-4 text-muted-foreground">No participants added yet.</p>
                )}
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
