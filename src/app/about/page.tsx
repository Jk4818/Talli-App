'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-secondary/50">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-headline">About Splitzy</CardTitle>
              <CardDescription className="text-lg">Fair, fast, and free bill splitting powered by AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-lg text-foreground/80">
              <p>
                Splitzy was born from a simple, universal frustration: the awkward shuffle of "who owes what" after a group meal or a shared expense. We've all been there, trying to decipher a crumpled receipt, calculating tips, and navigating the complexities of shared items. It's a hassle that can put a damper on an otherwise great time with friends.
              </p>
              <p>
                We believed there had to be a better way. In an age of artificial intelligence, why were we still manually punching numbers into calculators? That question sparked the idea for Splitzy—an app that makes splitting bills not just easy, but effortless.
              </p>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-2xl font-headline font-semibold text-foreground">Our Mission</h3>
                <p>
                  Our mission is to eliminate the friction from shared expenses. We want to give you back your time and save you from the mental gymnastics of bill splitting, so you can focus on what truly matters: enjoying the moment with your friends and family.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-headline font-semibold text-foreground">How It Works</h3>
                <p>
                  At the heart of Splitzy is a powerful AI engine. When you upload a photo of your receipt, our system doesn't just perform simple text recognition. It analyzes the layout, identifies line items, understands costs, and even flags potentially ambiguous entries for your review. This intelligent processing means you get a structured, editable list of expenses in seconds, ready to be assigned.
                </p>
                <p>
                  From there, our intuitive interface lets you drag, drop, and assign items with ease. Whether it's an equally shared appetizer or a complex percentage-based split, Splitzy handles the calculations flawlessly, ensuring penny-perfect accuracy every time.
                </p>
              </div>
              <p className="text-center pt-4">
                Thank you for using Splitzy. We're excited to make your life a little bit simpler.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p>&copy; {currentYear} Splitzy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
