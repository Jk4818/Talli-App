'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart, Users, UploadCloud, Divide, Menu } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
import { UserNav } from '@/components/auth/UserNav';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';

export default function Home() {
  const { user, loading } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const features = [
    {
      icon: <UploadCloud className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Scan',
      description: 'Snap a photo of your receipt and let our AI extract every item and price in seconds. No more manual entry.',
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Easy Assignments',
      description: 'Intuitively assign items to one or more people. Splitzy handles the math, even for shared items.',
    },
    {
      icon: <Divide className="h-8 w-8 text-primary" />,
      title: 'Fair Settlement',
      description: 'Get a clear summary of who owes whom. Our penny-perfect calculations ensure everyone pays their exact share.',
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: 'Insightful Summary',
      description: 'Visualize the spending breakdown with charts and detailed summaries for full transparency.',
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/demo">Demo</Link>
            </Button>
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/app">Go to App</Link>
                </Button>
                <UserNav />
              </>
            ) : (
              <>
                {!loading && (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">
                        Sign Up
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <Logo />
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <Separator className="my-4" />
                <nav className="flex flex-col gap-2">
                  <Link href="/demo" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                    Demo
                  </Link>
                  {user && (
                    <Link href="/app" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                      Go to App
                    </Link>
                  )}
                </nav>
                <div className="absolute bottom-6 left-6 right-6">
                  {user ? (
                      <UserNav />
                  ) : (
                    !loading && (
                      <Button asChild size="lg" className="w-full">
                        <Link href="/signup">
                          Start Splitting
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <motion.section 
          className="container mx-auto px-4 py-16 text-center lg:py-28"
          variants={staggerContainer(0.3, 0.2)}
          initial="hidden"
          animate="show"
        >
          <motion.h1 variants={fadeInUp} className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop arguing over the bill.
            <br />
            <span className="text-primary">Split it with AI.</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Splitzy makes group expenses simple. Upload a receipt, assign items, and we'll tell you exactly who owes what. Fair, fast, and free.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={user ? "/app" : "/signup"}>
                Start Splitting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Try a Live Demo</Link>
            </Button>
          </motion.div>
        </motion.section>

        <section className="bg-secondary/50 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid items-center gap-12 lg:grid-cols-2"
              variants={staggerContainer(0.2, 0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
            >
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">How It Works</div>
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">From Receipt to Resolution in 3 Steps</h2>
                <p className="text-muted-foreground">
                  Splitting a bill has never been easier. Our streamlined process saves you time and prevents awkward "who had what" conversations.
                </p>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Image 
                  src="https://placehold.co/1200x800.png" 
                  alt="Friends laughing and looking at a phone to split a restaurant bill with the Splitzy app."
                  data-ai-hint="friends restaurant"
                  width={1200}
                  height={800}
                  className="rounded-xl shadow-2xl"
                />
              </motion.div>
            </motion.div>
            <motion.div 
              className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
              variants={staggerContainer(0.2, 0.3)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {features.map((feature) => (
                <motion.div variants={fadeInUp} key={feature.title}>
                  <Card className="text-center h-full">
                    <CardHeader>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {feature.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p className="order-last md:order-none">&copy; {currentYear} Splitzy. Effortless bill splitting for everyone.</p>
            <nav className="flex gap-4">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/policy" className="hover:text-foreground transition-colors">Policy</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
