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
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function Step2Assignment() {
  const { items, currentAssignmentIndex, receipts, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const itemsWithCost = useMemo(() => items.filter(item => item.cost > 0), [items]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const unassignedItems = useMemo(() => {
    return itemsWithCost
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.assignees.length === 0);
  }, [itemsWithCost]);

  const assignedItemsCount = useMemo(() => {
    return itemsWithCost.length - unassignedItems.length;
  }, [itemsWithCost.length, unassignedItems.length]);

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
        <div className="flex justify-center items-center">
            <div className="relative w-full max-w-md">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex" style={{ marginLeft: '-1rem' }}>
                        {itemsWithCost.map((item, index) => (
                        <div className="min-w-0 shrink-0 grow-0 basis-full" style={{ paddingLeft: '1rem' }} key={item.id}>
                            <ItemAssignmentCard item={item} itemNumber={index + 1} totalItems={itemsWithCost.length} />
                        </div>
                        ))}
                    </div>
                </div>
                
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute h-8 w-8 rounded-full -left-12 top-1/2 -translate-y-1/2"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Previous slide</span>
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="absolute h-8 w-8 rounded-full -right-12 top-1/2 -translate-y-1/2"
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Next slide</span>
                </Button>
            </div>
        </div>

        {unassignedItems.length > 0 && (
            <Card className="max-w-xl mx-auto border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20">
                <CardHeader className='flex-row items-center gap-4 space-y-0'>
                    <ListTodo className="w-6 h-6 text-amber-600 dark:text-amber-500"/>
                    <div>
                        <CardTitle className="text-amber-700 dark:text-amber-400">Unassigned Items</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Click an item to jump to it and assign it to someone.</p>
                    <div className="flex flex-wrap gap-2">
                        {unassignedItems.map(({ item, index }) => {
                             const receipt = receipts.find(r => r.id === item.receiptId);
                             const currency = receipt?.currency || globalCurrency;
                             return (
                                <Tooltip key={item.id}>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="outline"
                                            className='h-auto max-w-[200px]'
                                            onClick={() => handleJumpToItem(index)}
                                        >
                                            <div className='flex flex-col text-left p-1 w-full'>
                                                <span className="truncate">{item.name}</span>
                                                <span className='text-xs text-muted-foreground'>
                                                    {(item.cost / 100).toLocaleString(undefined, { style: 'currency', currency })}
                                                </span>
                                            </div>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{item.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
