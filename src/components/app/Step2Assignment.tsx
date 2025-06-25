
"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import ItemAssignmentCard from './ItemAssignmentCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { setCurrentAssignmentIndex } from '@/lib/redux/slices/sessionSlice';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

export default function Step2Assignment() {
  const { items, currentAssignmentIndex, receipts, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const assignmentSectionRef = useRef<HTMLDivElement>(null);

  const itemsWithCost = useMemo(() => {
    return items.filter(item => {
      const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const effectiveCost = item.cost - totalItemDiscount;
      return effectiveCost > 0;
    });
  }, [items]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const itemsRequiringAttention = useMemo(() => {
    return itemsWithCost
        .map((item, index) => {
            let issue: string | null = null;
            const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
            const effectiveCost = item.cost - totalItemDiscount;

            if (item.assignees.length === 0 && effectiveCost > 0) {
                issue = "This item is unassigned.";
            } else if (item.assignees.length > 0) {
              if (item.splitMode === 'percentage') {
                  const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
                  if (totalPercentage !== 100) {
                      issue = `Percentages total to ${totalPercentage}%, not 100%.`;
                  }
              } else if (item.splitMode === 'exact') {
                  const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
                  if (totalExact !== effectiveCost) {
                      issue = "Exact amounts don't add up to the item total.";
                  }
              }
            }

            return { item, index, issue };
        })
        .filter((data): data is { item: typeof data.item; index: number; issue: string } => data.issue !== null);
  }, [itemsWithCost]);

  const issueItems = useMemo(() => {
    const issues = new Map<string, string>();
    itemsRequiringAttention.forEach(({ item, issue }) => {
        issues.set(item.id, issue);
    });
    return issues;
  }, [itemsRequiringAttention]);


  const assignedItemsCount = useMemo(() => {
    return itemsWithCost.filter(item => {
      const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const effectiveCost = item.cost - totalItemDiscount;
      if (effectiveCost <= 0) return true; // Zero-cost items are considered "assigned"
      if (item.assignees.length === 0) return false;
      if (item.splitMode === 'percentage') {
        const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
        return totalPercentage === 100;
      }
      if (item.splitMode === 'exact') {
        const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
        return totalExact === effectiveCost;
      }
      return true; // Equal split is always valid if there are assignees.
    }).length;
  }, [itemsWithCost]);


  const handleJumpToItem = (index: number) => {
    emblaApi?.scrollTo(index);
    assignmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: UseEmblaCarouselType[1]) => {
      if (!api) return;
      dispatch(setCurrentAssignmentIndex(api.selectedScrollSnap()));
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect(emblaApi);

    return () => {
      emblaApi?.off('select', onSelect);
      emblaApi?.off('reInit', onSelect);
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
                There are no items with an effective cost greater than zero. You can proceed to the summary or go back to add items.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer(0.2, 0.1)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
        <motion.div variants={fadeInUp} className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <p>Assignment Progress</p>
                <p>{assignedItemsCount} of {itemsWithCost.length} items assigned</p>
            </div>
            <Progress value={itemsWithCost.length > 0 ? (assignedItemsCount / itemsWithCost.length) * 100 : 100} />
        </motion.div>
        <motion.div 
            variants={fadeInUp} 
            className="flex flex-col items-center justify-center scroll-mt-48" 
            ref={assignmentSectionRef}
        >
            <div className="w-full max-w-md">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex" style={{ marginLeft: '-1rem' }}>
                        {itemsWithCost.map((item, index) => (
                        <div className="min-w-0 shrink-0 grow-0 basis-full" style={{ paddingLeft: '1rem' }} key={item.id}>
                            <ItemAssignmentCard 
                              item={item} 
                              itemNumber={index + 1} 
                              totalItems={itemsWithCost.length} 
                              hasIssue={issueItems.has(item.id)}
                              issueText={issueItems.get(item.id)}
                            />
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
        </motion.div>

        {itemsRequiringAttention.length > 0 && (
            <motion.div variants={fadeInUp}>
                <Card className="max-w-2xl mx-auto flex flex-col">
                    <CardHeader className='flex-row items-center gap-4 space-y-0'>
                        <AlertCircle className="w-6 h-6 text-destructive"/>
                        <div>
                            <CardTitle>Items Requiring Attention</CardTitle>
                            <CardDescription>These items have incomplete assignments. Click an item to fix it.</CardDescription>
                        </div>
                    </CardHeader>
                    {/* The fix is here: remove flex sizing from CardContent and apply a fixed height to ScrollArea */}
                    <CardContent className="p-0">
                        <ScrollArea className="h-72">
                            <div className="divide-y divide-border">
                                {itemsRequiringAttention.map(({ item, index, issue }) => {
                                    const receipt = receipts.find(r => r.id === item.receiptId);
                                    const currency = receipt?.currency || globalCurrency;
                                    const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
                                    const effectiveCost = item.cost - totalItemDiscount;
                                    const isError = issue !== 'This item is unassigned.';

                                    return (
                                        <div 
                                          key={item.id} 
                                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-accent/50 cursor-pointer"
                                          onClick={() => handleJumpToItem(index)}
                                        >
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <div className="flex justify-between items-center gap-4">
                                                    <p className="font-medium leading-snug truncate" title={item.name}>{item.name}</p>
                                                    <p className="text-sm font-mono text-muted-foreground whitespace-nowrap shrink-0">
                                                        {formatCurrency(effectiveCost, currency)}
                                                    </p>
                                                </div>
                                                <p className={cn("text-sm font-medium", isError ? "text-destructive" : "text-muted-foreground")}>
                                                  {issue}
                                                </p>
                                            </div>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleJumpToItem(index);
                                              }} 
                                              className="w-full sm:w-auto shrink-0"
                                            >
                                                Go to Item
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </motion.div>
        )}
    </motion.div>
  );
}
