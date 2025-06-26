"use client";

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Logo } from '../Logo';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';

const steps = [
    { id: 1, name: 'Setup', description: 'Add participants & receipts' },
    { id: 2, name: 'Assign', description: 'Split items between friends' },
    { id: 3, name: 'Settle', description: 'See who owes what' },
]

export function AppHeader() {
  const currentStep = useSelector((state: RootState) => state.session.step);

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Logo />
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
              <React.Fragment key={step.name}>
                <li className="relative">
                  <>
                    {step.id < currentStep ? (
                      <div className="flex items-center">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                            <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="flex items-center" aria-current="step">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold text-primary">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="flex h-9 items-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                            <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                          </span>
                        </span>
                        <span className="ml-4 hidden sm:flex flex-col">
                          <span className="text-sm font-semibold text-muted-foreground">{step.name}</span>
                          <span className="text-sm text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    )}
                  </>
                </li>

                {stepIdx < steps.length - 1 ? (
                  <li className="flex-auto hidden sm:block px-4" aria-hidden="true">
                     <div className={cn(
                        "h-0.5 w-full",
                        currentStep > step.id ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  </li>
                ) : null}
              </React.Fragment>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  );
}
