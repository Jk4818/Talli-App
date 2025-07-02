
'use client';

import React, { useState, useEffect } from 'react';
import { type Item, type Discount, type Receipt } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Sparkles, AlertCircle, Check, Pencil, Layers, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { formatCurrency } from '@/lib/utils';
import { applySuggestedDiscount, ignoreSuggestedDiscount, reassignSuggestedDiscount, removeDiscount } from '@/lib/redux/slices/sessionSlice';
import { DropDrawer, DropDrawerTrigger, DropDrawerContent, DropDrawerLabel, DropDrawerItem } from '../ui/dropdrawer';
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogContent } from '../ui/alert-dialog';

interface Suggestion {
  receiptId: string;
  discount: Discount;
  targetItem?: Item;
}

interface SuggestionResolverDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  suggestions: Suggestion[];
}

export default function SuggestionResolverDialog({ isOpen, onOpenChange, suggestions }: SuggestionResolverDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const { items, receipts } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    // When the dialog opens, or the list of suggestions changes, reset to the first one.
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, suggestions]);

  // If there are no more suggestions, close the dialog
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      onOpenChange(false);
    }
  }, [isOpen, suggestions, onOpenChange]);

  if (!isOpen || suggestions.length === 0 || currentIndex >= suggestions.length) {
    return null;
  }
  
  const currentSuggestion = suggestions[currentIndex];
  const { receiptId, discount, targetItem } = currentSuggestion;
  const receipt = receipts.find(r => r.id === receiptId);
  
  const handleResolve = (action: () => void) => {
    action();
    // No need to increment index, as the suggestions array will shrink and a new suggestion
    // at the current index will be rendered. If it's the last one, the effect above handles closing.
  };

  const handleApply = () => handleResolve(() => dispatch(applySuggestedDiscount({ receiptId, discountId: discount.id })));
  const handleIgnore = () => handleResolve(() => dispatch(ignoreSuggestedDiscount({ receiptId, discountId: discount.id })));
  const handleReassign = (newTargetItemId: string) => handleResolve(() => dispatch(reassignSuggestedDiscount({ receiptId, discountId: discount.id, newTargetItemId })));
  const handleRemove = () => handleResolve(() => dispatch(removeDiscount({ receiptId, discountId: discount.id })));

  const isConflict = !!targetItem && discount.amount > targetItem.cost;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review AI Discount Suggestions</DialogTitle>
          <DialogDescription>
            The AI has found discounts that might apply to specific items. Please confirm or reassign them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                  <span>Progress</span>
                  <span>Suggestion {currentIndex + 1} of {suggestions.length}</span>
              </div>
              <Progress value={((currentIndex + 1) / suggestions.length) * 100} />
          </div>

          <Card>
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <CardTitle>{discount.name}</CardTitle>
                        <p className="text-2xl font-bold text-primary">- {formatCurrency(discount.amount, receipt?.currency || 'USD')}</p>
                    </div>
                    {discount.confidence && <Badge variant="secondary" className="text-primary font-medium"><Sparkles className='h-3 w-3 mr-1.5' /> {discount.confidence}%</Badge>}
                </div>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Suggested for Item:</p>
                {targetItem ? (
                    <div className="rounded-md border p-3 bg-secondary/50">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">{targetItem.name}</p>
                            <p className="font-mono">{formatCurrency(targetItem.cost, receipt?.currency || 'USD')}</p>
                        </div>
                    </div>
                ) : (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Item Not Found</AlertTitle>
                        <AlertDescription>
                          The suggested item for this discount may have been deleted.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
          </Card>
          
          {isConflict && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Potential Conflict</AlertTitle>
                  <AlertDescription>
                      Applying this discount would make the item cost negative. Please reassign or remove it.
                  </AlertDescription>
              </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             <Button onClick={handleApply} disabled={!targetItem || isConflict}>
                  <Check className="mr-2 h-4 w-4" /> Apply to Item
             </Button>
             <DropDrawer>
                <DropDrawerTrigger asChild>
                    <Button variant="outline" disabled={!targetItem}>
                        <Pencil className="mr-2 h-4 w-4" /> Reassign
                    </Button>
                </DropDrawerTrigger>
                <DropDrawerContent>
                    <DropDrawerLabel>Reassign to another item on "{receipt?.name}"</DropDrawerLabel>
                    {items.filter(i => i.receiptId === receiptId).map(item => (
                        <DropDrawerItem key={item.id} onClick={() => handleReassign(item.id)}>
                            {item.name}
                        </DropDrawerItem>
                    ))}
                </DropDrawerContent>
             </DropDrawer>
             <Button variant="secondary" onClick={handleIgnore}>
                  <Layers className="mr-2 h-4 w-4" /> Make Receipt-Wide
             </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Discount
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the AI-suggested &quot;{discount.name}&quot; discount. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Resolve Later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
