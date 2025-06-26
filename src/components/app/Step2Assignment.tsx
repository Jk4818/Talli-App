
"use client";

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react';
import ItemAssignmentCard from './ItemAssignmentCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, ArrowLeft, ArrowRight, ListTodo } from 'lucide-react';
import { setCurrentAssignmentIndex } from '@/lib/redux/slices/sessionSlice';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { AccessibleTooltip } from '../ui/accessible-tooltip';

export default function Step2Assignment() {
  const { items, currentAssignmentIndex, receipts, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const itemsWithCost = useMemo(() => items.filter(item => item.cost > 0), [items]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const itemsRequiringAttention = useMemo(() => {
    return itemsWithCost
        .map((item, index) => {
            let issue: string | null = null;
            if (item.assignees.length === 0) {
                issue = "Unassigned";
            } else if (item.splitMode === 'percentage') {
                const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
                if (totalPercentage !== 100) {
                    issue = `Percentages total to ${totalPercentage}%, not 100%.`;
                }
            } else if (item.splitMode === 'exact') {
                const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
                if (totalExact !== item.cost) {
                    issue = "Exact amounts don't add up to item total.";
                }
            }
            return { item, index, issue };
        })
        .filter((data): data is { item: typeof data.item; index: number; issue: string } => data.issue !== null);
  }, [itemsWithCost]);

  const assignedItemsCount = useMemo(() => {
    return itemsWithCost.length - itemsRequiringAttention.length;
  }, [itemsWithCost.length, itemsRequiringAttention.length]);


  const handleJumpToItem = (index: number) => {
    emblaApi?.scrollTo(index);
  };
  
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: EmblaCarouselType) => {
      dispatch(setCurrentAssignmentIndex(api.selectedScrollSnap()));
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect(emblaApi);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, dispatch]);

  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== currentAssignmentIndex) {
      emblaApi.scrollTo(currentAssignmentIndex, true);
    }
  }, [emblaApi, currentAssignmentIndex]);

  if (itemsWithCost.length === 0) {
    return (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Items to Assign</AlertTitle>
            <AlertDescription>
                There are no items with a cost greater than zero. You can proceed to the summary or go back to add items.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-8">
        <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <p>Assignment Progress</p>
                <p>{assignedItemsCount} of {itemsWithCost.length} items assigned</p>
            </div>
            <Progress value={itemsWithCost.length > 0 ? (assignedItemsCount / itemsWithCost.length) * 100 : 100} />
        </div>
        <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex" style={{ marginLeft: '-1rem' }}>
                        {itemsWithCost.map((item, index) => (
                        <div className="min-w-0 shrink-0 grow-0 basis-full" style={{ paddingLeft: '1rem' }} key={item.id}>
                            <ItemAssignmentCard item={item} itemNumber={index + 1} totalItems={itemsWithCost.length} />
                        </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="w-28"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Prev</span>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="w-28"
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                >
                    <span>Next</span>
                    <ArrowRight className="h-5 w-5" />
                </Button>
            </div>
        </div>

        {itemsRequiringAttention.length > 0 && (
            <Card className="max-w-xl mx-auto border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20">
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <ListTodo className="w-6 h-6 text-amber-600 dark:text-amber-500"/>
                    <div>
                        <CardTitle className="text-amber-700 dark:text-amber-400">Items Requiring Attention</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Click an item to jump to it and resolve the assignment issue.</p>
                    <div className="flex flex-wrap gap-2">
                        {itemsRequiringAttention.map(({ item, index, issue }) => {
                             const receipt = receipts.find(r => r.id === item.receiptId);
                             const currency = receipt?.currency || globalCurrency;
                             return (
                                <AccessibleTooltip
                                  key={item.id}
                                  content={
                                    <>
                                      <p>{item.name}</p>
                                      <p className="text-destructive">{issue}</p>
                                    </>
                                  }
                                >
                                  <Button
                                    variant="outline"
                                    className="h-auto max-w-[200px]"
                                    onClick={() => handleJumpToItem(index)}
                                  >
                                    <div className="flex flex-col text-left p-1 w-full">
                                      <span className="truncate">{item.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {(item.cost / 100).toLocaleString(
                                          undefined,
                                          { style: 'currency', currency }
                                        )}
                                      </span>
                                      <span className="text-xs text-destructive truncate">
                                        {issue}
                                      </span>
                                    </div>
                                  </Button>
                                </AccessibleTooltip>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
