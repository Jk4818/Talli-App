'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BrainCircuit, Target } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function AboutPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <main
        className="flex-1"
      >
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">About Talli</h1>
            <p className="text-lg md:text-xl font-bold text-muted-background">
              Fair, fast, and free bill splitting powered by AI.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-12 md:mt-16 text-lg text-foreground/80 space-y-8">
            <p>
              Talli was born from a simple, universal frustration: the awkward shuffle of "who owes what" after a group meal or a shared expense. We've all been there, trying to decipher a crumpled receipt, calculating tips, and navigating the complexities of shared items. It's a hassle that can put a damper on an otherwise great time with friends.
            </p>
            <p>
              We believed there had to be a better way. In an age of artificial intelligence, why were we still manually punching numbers into calculators? That question sparked the idea for Talli—an app that makes splitting bills not just easy, but effortless.
            </p>
          </div>

          <Separator className="my-12 md:my-16" />

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto"
            variants={staggerContainer(0.2, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.div variants={fadeInUp} className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-headline font-semibold text-foreground">Our Mission</h3>
                </div>
              <p className="text-foreground/80">
                Our mission is to eliminate the friction from shared expenses. We want to give you back your time and save you from the mental gymnastics of bill splitting, so you can focus on what truly matters: enjoying the moment with your friends and family.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-4">
              <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-headline font-semibold text-foreground">How It Works</h3>
                </div>
              <p className="text-foreground/80">
                At the heart of Talli is a powerful AI engine. When you upload a photo of your receipt, our system doesn't just perform simple text recognition. It analyzes the layout, identifies line items, and understands the costs to digitize your bill in seconds.
              </p>
              <p className="text-foreground/80">
                The AI gives you a running start, but you're always in control. Our intuitive interface lets you easily edit any item, add or remove people from a split, and choose how to divide the cost—equally, by percentage, or by exact amounts. Talli handles all the math flawlessly, ensuring penny-perfect accuracy every time.
              </p>
            </motion.div>
          </motion.div>
          
          <div className="text-center mt-16">
            <motion.p 
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2, }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Thank you for using Talli. We're excited to make your life a little bit simpler.
            </motion.p>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p className="order-last md:order-none">&copy; {currentYear} Talli. All rights reserved.</p>
            <nav className="flex gap-4">
                <Link href="/policy" className="hover:text-foreground transition-colors">Policy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
