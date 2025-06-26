"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import ItemAssignmentCard from './ItemAssignmentCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { setCurrentAssignmentIndex } from '@/lib/redux/slices/sessionSlice';

export default function Step2Assignment() {
  const { items, currentAssignmentIndex } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const [api, setApi] = React.useState<CarouselApi>();

  const itemsWithCost = items.filter(item => item.cost > 0);
  
  const currentItem = itemsWithCost[currentAssignmentIndex];
  const isCurrentItemAssigned = currentItem?.assignees.length > 0;
  const isLastSlide = currentAssignmentIndex === itemsWithCost.length - 1;

  React.useEffect(() => {
    if (!api) return;
    
    const handleSelect = () => {
      const selectedSnap = api.selectedScrollSnap();
      if (currentAssignmentIndex !== selectedSnap) {
        dispatch(setCurrentAssignmentIndex(selectedSnap));
      }
    };

    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api, dispatch, currentAssignmentIndex]);

  // Re-initialize the carousel with updated draggable option when assignment status changes
  React.useEffect(() => {
    if (!api) return;
    api.reInit({
        loop: false,
        keyboard: false,
        draggable: isCurrentItemAssigned,
    });
  }, [api, isCurrentItemAssigned]);

  // Sync Redux state with carousel's internal state in case they diverge
  React.useEffect(() => {
    if (api && api.selectedScrollSnap() !== currentAssignmentIndex) {
        api.scrollTo(currentAssignmentIndex, true); // true for instant scroll
    }
  }, [api, currentAssignmentIndex]);


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
      <Carousel 
        setApi={setApi}
        className="w-full max-w-md"
        opts={{ 
            loop: false, 
            keyboard: false,
            draggable: isCurrentItemAssigned,
        }}
      >
        <CarouselContent>
          {itemsWithCost.map((item, index) => (
            <CarouselItem key={item.id}>
              <ItemAssignmentCard item={item} itemNumber={index + 1} totalItems={itemsWithCost.length} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        { !isLastSlide && <CarouselNext disabled={!isCurrentItemAssigned} /> }
      </Carousel>
    </div>
  );
}
