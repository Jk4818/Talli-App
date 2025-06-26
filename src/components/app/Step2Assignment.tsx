"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react';
import ItemAssignmentCard from './ItemAssignmentCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { setCurrentAssignmentIndex } from '@/lib/redux/slices/sessionSlice';
import { Button } from '../ui/button';

export default function Step2Assignment() {
  const { items, currentAssignmentIndex } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const itemsWithCost = items.filter(item => item.cost > 0);
  const currentItem = itemsWithCost[currentAssignmentIndex];
  const isCurrentItemAssigned = currentItem?.assignees.length > 0;
  const isLastSlide = currentAssignmentIndex === itemsWithCost.length - 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    keyboard: { active: false },
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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
    if (!emblaApi) return;
    emblaApi.reInit({
      loop: false,
      keyboard: { active: false },
      draggable: isCurrentItemAssigned,
    });
  }, [emblaApi, isCurrentItemAssigned]);

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
    <div className="flex justify-center items-center py-8">
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

        { !isLastSlide && (
            <Button
                variant="outline"
                size="icon"
                className="absolute h-8 w-8 rounded-full -right-12 top-1/2 -translate-y-1/2"
                onClick={scrollNext}
                disabled={!canScrollNext || !isCurrentItemAssigned}
            >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">Next slide</span>
            </Button>
        )}
      </div>
    </div>
  );
}
