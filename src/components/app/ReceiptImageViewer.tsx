"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Receipt } from '@/lib/types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ReceiptImageViewerProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ReceiptImageViewer({ receipt, isOpen, onOpenChange }: ReceiptImageViewerProps) {
  const [scale, setScale] = useState(1);

  if (!receipt || !receipt.imageDataUri) {
    return null;
  }
  
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const handleReset = () => setScale(1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Receipt: {receipt.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/50 rounded-md flex items-center justify-center p-4">
          <img 
            src={receipt.imageDataUri} 
            alt={`Receipt for ${receipt.name}`}
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
              maxWidth: '100%',
              maxHeight: '100%',
            }} 
          />
        </div>
        <DialogFooter className="flex-row justify-center items-center gap-2 pt-4">
            <Button variant="outline" onClick={handleZoomOut} disabled={scale <= 0.2}>
                <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={scale === 1}>
                <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" onClick={handleZoomIn} disabled={scale >= 5}>
                <ZoomIn className="h-4 w-4" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
