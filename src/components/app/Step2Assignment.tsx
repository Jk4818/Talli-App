"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import ItemAssignmentCard from './ItemAssignmentCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Step2Assignment() {
  const { items } = useSelector((state: RootState) => state.session);

  const itemsWithCost = items.filter(item => item.cost > 0);

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
      <Carousel className="w-full max-w-md" opts={{ loop: true }}>
        <CarouselContent>
          {itemsWithCost.map((item, index) => (
            <CarouselItem key={item.id}>
              <ItemAssignmentCard item={item} itemNumber={index + 1} totalItems={itemsWithCost.length} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
