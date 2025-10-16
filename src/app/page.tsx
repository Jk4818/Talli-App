

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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function Home() {
  const { user, loading } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const features = [
    {
      title: 'Snap & Scan',
      subtitle: 'Forget typing. Upload once and get a clean, digital breakdown in seconds.',
      description: "Just snap a photo of your receipt, and Talli instantly gets to work. Powered by cutting-edge AI (thanks to Google's Gemini), our system doesn’t just read the text—it understands it. Items, quantities, modifiers, discounts, tax, tips—it’s all extracted and structured automatically.",
      image: '/images/receipt_hand.png',
      image_int: '/images/dream_int.png',
    },
    {
      title: 'Split With Anyone',
      subtitle: 'One tap to share the cost, your way.',
      description: 'Our intuitive interface makes item assignment fast and flexible. Drag and drop your friends onto what they ordered, or let them assign themselves. Whether you’re splitting equally, by percentage, or by exact dollar amount—Talli adapts in real time.',
      image: '/images/travel.png',
      image_int: '/images/newad_int.png',
    },
    {
      title: 'Settle Up Simply',
      subtitle: 'Every cent, every time — perfectly calculated.',
      description: 'We’ve engineered a deterministic rounding system that distributes every cent fairly—even when the numbers don’t divide evenly. Discounts, service fees, taxes, and multi-person shares? Handled. Automatically. Accurately. Transparently. You and your friends get a clear summary of who owes what — no confusion, no arguments, just clean math and clear communication.',
      image: '/images/wedding.png',
      image_int: '/images/big_int.png',
    },
    {
      title: 'Visualize-a-bill-ity',
      subtitle: 'Clear breakdowns, at a glance.',
      description: "Talli gives you a bird's-eye view of group spending with clean, easy-to-read charts that show exactly who paid what, who owes whom, and how items were distributed. From individual contributions to overall group totals, the visualizations make it simple to understand the financial breakdown of any shared expense. It's a straightforward way to keep everything transparent and easy to reconcile, without digging through line items or doing the math yourself.",
      image: '/images/straw.avif',
      image_int: '/images/newad_int.png',
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <div className="md:container md:mx-auto md:px-4 ">
          <div className="min-h-[75vh] md:mt-10 flex flex-col md:justify-center isolate overflow-hidden bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%),url('/images/hand_mockup.jpeg')] bg-cover bg-bottom rounded-b-3xl md:rounded-3xl">
            <motion.section
              className="container mx-auto px-8 py-16 lg:py-28"
              variants={staggerContainer(0.3, 0.2)}
              initial="hidden"
              animate="show"
            >
              <motion.h1 variants={fadeInUp} className="font-headline text-background font-black tracking-tight text-5xl lg:text-6xl">
                Stop arguing over the bill,
                <br />
                <span className="text-secondary">Split it with AI.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="mt-6 max-w-2xl text-lg text-background">
                Talli makes group expenses simple. Upload a receipt, assign items, and we'll tell you exactly who owes what. Fair, fast, and free.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-8 flex justify-start">
                <Alert className="max-w-2xl text-left bg-background/80 backdrop-blur-sm">
                  <Rocket className="h-4 w-4" />
                  <AlertTitle>Welcome to the Beta!</AlertTitle>
                  <AlertDescription>
                    Talli is currently in an invite-only beta. Functionality may change as we improve the app.
                  </AlertDescription>
                </Alert>
              </motion.div>
              <motion.div variants={fadeInUp} className="mt-8 flex self-start gap-4 ">
                <Button size="lg" asChild>
                  <Link href={user ? "/app" : "/login"}>
                    Start Splitting Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.section>
          </div>
          <div className="h-full font-headline font-bold text-right pt-4 px-4">AI can make mistakes, so double-check it</div>
        </div>

        <section className="container px-4  py-16 lg:py-24 space-y-4">
          <div>
            <h2 className="px-4 pb-2 font-headline text-3xl font-bold tracking-tight sm:text-4xl">Split Bills. Not Friendships.</h2>
            <h3 className="px-4 pb-4 font-headline text-primary text-lg">Because Everyone Hates Doing the Math</h3>
          </div>
          <div className=" mx-auto flex flex-col gap-10">
            <div
              className="rounded-3xl bg-cover bg-center flex flex-col justify-end min-h-[600px]"
              style={{ backgroundImage: "url('/images/feature1.png')" }}
            >
              <motion.div
                className="rounded-3xl p-8 md:p-16 bg-gradient-to-t from-black/80 to-black/0"
                variants={staggerContainer(0.2, 0.1)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.5 }}
              >
                <motion.div variants={fadeInUp} className="max-w-xl space-y-4 text-background ">
                  <div className="inline-block rounded-lg bg-background  px-3 py-1 text-sm font-medium text-primary">How It Works</div>
                  <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">From Receipt to Resolution in 3 Steps</h2>
                  <p className="text-muted-background">
                    Splitting a bill has never been easier. Our streamlined process saves you time and prevents awkward "who had what" conversations.
                  </p>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </section>
        <section className="w-full pb-10">
          <Carousel className="h-screen w-full">
            <CarouselContent className='h-screen'>
              {features.map((feature, index) => (
                <CarouselItem key={index} className="relative">
                  <Card 
                    className="h-full border-0 overflow-hidden bg-cover bg-bottom rounded-3xl flex flex-col"
                    style={{ backgroundImage: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%), url('${feature.image}')` }}
                  >
                    <CardContent className="flex flex-col md:items-center justify-center pt-20 md:mx-32 text-background md:text-center gap-4 z-10">
                      <CardTitle className="font-headline text-3xl md:text-4xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className='text-muted-background font-bold md:text-xl'>{feature.subtitle}</CardDescription>
                      <p className='text-muted-background'>{feature.description}</p>
                    </CardContent>

                    <div className="max-h-50 min-h-32 flex-grow relative w-full h-full">
                      <Image 
                        src={feature.image_int}
                        alt=""
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className='absolute bottom-0 flex w-full justify-center items-center gap-4 px-4 z-20'>
              <CarouselPrevious className='border-0'/>
              <CarouselNext className='border-0'/>
            </div>
          </Carousel>
        </section>
        
        <section className="container px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-start gap-6 text-left">
                  <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                      No phone? No problem.
                  </h2>
                  <p className="text-lg text-muted-foreground">
                      Talli is built for the web, which means it works beautifully on your desktop, laptop, or tablet—no app download required. Start a split on your phone and finish it on your computer seamlessly.
                  </p>
                  <Button size="lg" asChild>
                      <Link href={user ? "/app" : "/signup"}>
                          Start Splitting Now
                          <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                  </Button>
              </div>
              <div className="flex justify-center">
                  <Image 
                      src="/images/pinky.png"
                      alt="Friends celebrating together"
                      width={500}
                      height={500}
                      className="rounded-3xl aspect-square object-cover"
                  />
              </div>
          </div>
        </section>
        
        <section className="container px-4 py-16 lg:py-24 text-left md:text-center">
          <div className="max-w-2xl mx-auto flex flex-col items-start md:items-center gap-6">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                  Precision engineered for every penny
              </h2>
              <Button size="lg" asChild>
                  <Link href={user ? "/app" : "/signup"}>
                      Try Talli Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
              </Button>
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
