
"use client";

import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { restoreSession } from '@/lib/redux/slices/sessionSlice';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import type { SessionState } from '@/lib/types';

export default function ImportButton({ children, ...props }: React.PropsWithChildren<ButtonProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemo = useSelector((state: RootState) => state.session.isDemoSession);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Failed to read file content.');
        }
        const data = JSON.parse(text) as Partial<SessionState>;

        // Basic validation to ensure it's a valid session file
        if (data && typeof data === 'object' && 'participants' in data && 'items' in data && 'receipts' in data) {
          dispatch(restoreSession(data));
          toast({
            title: 'Session Imported',
            description: 'Your session has been successfully restored.',
          });
          router.push(isDemo ? '/demo' : '/app');
        } else {
          throw new Error('Invalid session file format.');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Could not import the session file.',
        });
      } finally {
        // Reset file input value to allow re-uploading the same file
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'There was an error reading the file.',
        });
    }
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/json"
      />
      <Button onClick={handleButtonClick} {...props}>
        {children}
      </Button>
    </>
  );
}
