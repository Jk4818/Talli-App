
'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart, Users, UploadCloud, Divide, Menu, Rocket } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Home() {
  const { user, loading } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const features = [
    {
      emoji: '📸',
      title: 'Snap & Scan',
      description: 'Forget typing. Just snap a photo of your receipt and our AI will digitize every item and price in seconds.',
    },
    {
      emoji: '🙋‍♀️',
      title: 'Drag, Drop, Done',
      description: 'Assigning items is a breeze. Drag items to friends, split shared dishes, and watch the math solve itself. "Who had the wagyu?" Solved.',
    },
    {
      emoji: '💸',
      title: 'Settle Up Simply',
      description: 'No more awkward IOUs. Get a simple, clear breakdown of who owes whom. Settle up in seconds and stay friends.',
    },
    {
      emoji: '📊',
      title: 'Visualize-a-bill-ity',
      description: "Get a bird's-eye view of the spending. Cool charts show who spent what, making everything transparent and fair.",
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
             <Link href="/demo" className={buttonVariants({ variant: 'outline' })}>
                Live Demo
              </Link>
              {user && (
                <Link href="/app" className={buttonVariants({ variant: 'ghost' })}>
                  Go to App
                </Link>
              )}

            <div className="w-px h-6 bg-border mx-2" />

            {user ? (
                <UserNav />
            ) : (
              !loading && (
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
              )
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
                    Live Demo
                  </Link>
                  {user && (
                    <Link href="/app" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                      Go to App
                    </Link>
                  )}
                  <Separator className="my-2" />
                  <Link href="/about" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                    About Us
                  </Link>
                  <Link href="/policy" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}>
                    Terms of Service
                  </Link>
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
        <div className="h-screen md:container md:mx-auto md:px-4 ">
        <div className="min-h-[85vh] flex flex-col md:justify-center isolate overflow-hidden bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%),url('/images/hand_mockup.jpeg')] bg-cover bg-bottom rounded-b-3xl">
              <motion.section
                className="container mx-auto px-8 py-16 lg:py-28"
                variants={staggerContainer(0.3, 0.2)}
                initial="hidden"
                animate="show"
              >
                <motion.h1 variants={fadeInUp} className="font-headline text-background font-bold tracking-tight text-5xl lg:text-6xl">
                  Stop arguing over the bill.
                  <br />
                  <span className="text-secondary">Split it with AI.*</span>
                </motion.h1>
                <motion.p variants={fadeInUp} className="mt-6 max-w-2xl text-lg text-background">
                  Talli makes group expenses simple. Upload a receipt, assign items, and we'll tell you exactly who owes what. Fair, fast, and free.
                </motion.p>
                <motion.div variants={fadeInUp} className="mt-8 flex justify-start">
                  <Alert className="max-w-2xl text-left">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Welcome to the Beta!</AlertTitle>
                    <AlertDescription>
                      Talli is currently in an invite-only beta. Functionality may change as we improve the app.
                    </AlertDescription>
                  </Alert>
                </motion.div>
                <motion.div variants={fadeInUp} className="mt-8 flex self-start gap-4">
                  <Button size="lg" asChild>
                    <Link href={user ? "/app" : "/login"}>
                      Start Splitting Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.section>
          </div>
          <div className="h-full text-right pt-4">*AI can make mistakes, so double-check it</div>
        </div>

        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-secondary/50 rounded-3xl p-8 md:p-16">
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
                    src="/images/hero_image.png"
                    alt="Illustration of friends happily splitting a restaurant bill using the Talli app on a smartphone."
                    width={900}
                    height={600}
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="bill splitting friends"
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
                          <span className="text-3xl">{feature.emoji}</span>
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
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p className="order-last md:order-none">&copy; {currentYear} Talli. Effortless bill splitting for everyone.</p>
            <nav className="flex gap-4">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/policy" className="hover:text-foreground transition-colors">Policy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
