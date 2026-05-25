
'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ArrowRight,
  ScanLine,
  Users,
  PieChart,
  Sparkles,
  Menu,
  Rocket,
  Check,
  Monitor,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
import { UserNav } from '@/components/auth/UserNav';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';

// ── Static data ──────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Upload Your Receipt',
    description: 'Snap a photo or upload from your gallery. Our AI reads every line — items, modifiers, discounts, tax, and tip.',
    Icon: ScanLine,
  },
  {
    number: '02',
    title: 'Assign Items',
    description: "Tap to assign what each person ordered. Split items equally, by percentage, or down to the exact cent.",
    Icon: Users,
  },
  {
    number: '03',
    title: 'Share the Total',
    description: 'Everyone gets a precise, transparent breakdown of exactly what they owe. No arguments, just clean math.',
    Icon: Check,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  const ctaHref    = user ? '/app' : '/login';
  const signupHref = user ? '/app' : '/signup';

  return (
    <div className="flex flex-col min-h-dvh bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        role="banner"
        className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
            <Link href="/demo" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Live Demo
            </Link>
            {user && (
              <Link href="/app" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Go to App
              </Link>
            )}
            <ThemeToggle size="icon-sm" />
            {mounted && (
              user ? (
                <UserNav />
              ) : (
                !loading && (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/signup">
                        Sign Up
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </>
                )
              )
            )}
          </nav>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <Logo />
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <Separator className="my-4" />
                <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
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
                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">Appearance</span>
                    <ThemeToggle size="icon-sm" />
                  </div>
                  {mounted && (
                    user ? (
                      <UserNav />
                    ) : (
                      !loading && (
                        <Button asChild size="lg" className="w-full">
                          <Link href="/signup">
                            Start Splitting
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      )
                    )
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-heading" className="md:container md:mx-auto md:px-4">
          <div
            className="relative min-h-[82vh] md:mt-10 flex flex-col justify-end isolate overflow-hidden bg-cover bg-bottom rounded-b-3xl md:rounded-3xl"
            style={{ backgroundImage: "url('/images/hand_mockup.jpeg')" }}
          >
            {/* Dark overlay — ensures text is always readable regardless of theme */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
              aria-hidden="true"
            />

            <motion.div
              className="relative z-10 px-6 pb-12 pt-32 md:px-12 md:pb-16 lg:pb-20"
              variants={staggerContainer(0.15, 0.1)}
              initial="hidden"
              animate="show"
            >
              {/* Beta pill */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span
                  role="note"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white/90"
                >
                  <Rocket className="h-3 w-3" aria-hidden="true" />
                  Invite-only Beta — functionality may change as we improve
                </span>
              </motion.div>

              {/* H1 — only h1 on the page */}
              <motion.h1
                id="hero-heading"
                variants={fadeInUp}
                className="font-headline font-black tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl max-w-2xl"
              >
                Stop arguing over the bill.
                <br />
                <span className="text-purple-300">Split it with AI.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="mt-4 max-w-xl text-base sm:text-lg text-white/75 font-body"
              >
                Talli makes group expenses simple. Upload a receipt, assign items, and we'll tell you exactly who owes what — fair, fast, and free.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href={ctaHref}>
                    Start Splitting Now
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="text-white hover:text-white hover:bg-white/15"
                >
                  <Link href="/demo">See Live Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Disclaimer */}
          <p className="mt-2 px-4 text-xs text-right text-muted-foreground font-body" role="note">
            AI can make mistakes — always double-check your totals
          </p>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <motion.section
          aria-labelledby="how-it-works-heading"
          className="container mx-auto px-4 py-16 lg:py-24"
          variants={staggerContainer(0.15, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Section label + heading */}
          <motion.div variants={fadeInUp} className="mb-12">
            <span className="text-sm font-medium text-primary uppercase tracking-widest font-body">
              Simple by design
            </span>
            <h2
              id="how-it-works-heading"
              className="mt-2 font-headline text-3xl font-bold tracking-tight sm:text-4xl text-foreground"
            >
              From receipt to settled in 3 steps
            </h2>
          </motion.div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                role="listitem"
                className="rounded-2xl bg-card p-6 flex flex-col gap-4 shadow-sm dark:shadow-none"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="font-headline font-black text-5xl text-primary/20 tabular-nums leading-none select-none"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <step.Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Feature Bento Grid ───────────────────────────────────────────── */}
        <motion.section
          aria-labelledby="features-heading"
          className="container mx-auto px-4 py-8 lg:py-16"
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Section label + heading */}
          <motion.div variants={fadeInUp} className="mb-10">
            <span className="text-sm font-medium text-primary uppercase tracking-widest font-body">
              Everything you need
            </span>
            <h2
              id="features-heading"
              className="mt-2 font-headline text-3xl font-bold tracking-tight sm:text-4xl text-foreground"
            >
              Split Bills. Not Friendships.
            </h2>
            <p className="mt-2 text-muted-foreground font-body max-w-md">
              Because everyone hates doing the math.
            </p>
          </motion.div>

          {/* Bento: 4-column grid on lg, 2 on md, 1 on sm */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Snap & Scan — spans 2 columns, shows screenshot */}
            <motion.article
              variants={fadeInUp}
              aria-label="Snap and Scan feature"
              className="lg:col-span-2 rounded-2xl bg-card overflow-hidden flex flex-col shadow-sm dark:shadow-none"
            >
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                    <ScanLine className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-body">
                    Snap {'&'} Scan
                  </span>
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">
                  Forget typing. Upload once.
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Powered by Google Gemini AI — items, quantities, modifiers, discounts, tax, and tips are extracted and structured automatically in seconds.
                </p>
              </div>
              <div className="relative mt-auto w-full h-52 bg-secondary overflow-hidden" aria-hidden="true">
                <Image
                  src="/images/recepit_organiser_violet.png"
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.article>

            {/* Split With Anyone — spans 2 columns, shows screenshot */}
            <motion.article
              variants={fadeInUp}
              aria-label="Split With Anyone feature"
              className="lg:col-span-2 rounded-2xl bg-card overflow-hidden flex flex-col shadow-sm dark:shadow-none"
            >
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10" aria-hidden="true">
                    <Users className="h-4 w-4 text-accent" />
                  </span>
                  <span className="text-xs font-semibold text-accent uppercase tracking-widest font-body">
                    Split With Anyone
                  </span>
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">
                  One tap to share the cost.
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Assign items individually, split equally, or by percentage. Whether it's 2 people or 12 — Talli adapts to how your group actually works.
                </p>
              </div>
              <div className="relative mt-auto w-full h-52 bg-secondary overflow-hidden" aria-hidden="true">
                <Image
                  src="/images/fountain.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.article>

            {/* Visualize Everything — spans 2 columns */}
            <motion.article
              variants={fadeInUp}
              aria-label="Visualize Everything feature"
              className="md:col-span-1 lg:col-span-2 rounded-2xl bg-card p-6 flex flex-col gap-4 shadow-sm dark:shadow-none"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                <PieChart className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-headline font-bold text-xl text-foreground">Visualize Everything</h3>
                <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">
                  Clean, easy-to-read charts that show who paid what, who owes whom, and how items were distributed. Transparent by default.
                </p>
              </div>
              <ul className="space-y-2 mt-auto" role="list" aria-label="Visualize Everything highlights">
                {[
                  'Individual contributions',
                  'Group totals at a glance',
                  'Category breakdown',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground font-body">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.article>

            {/* Penny-Perfect Math — spans 2 columns */}
            <motion.article
              variants={fadeInUp}
              aria-label="Penny-Perfect Math feature"
              className="md:col-span-1 lg:col-span-2 rounded-2xl bg-card p-6 flex flex-col gap-4 shadow-sm dark:shadow-none"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10" aria-hidden="true">
                <Sparkles className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h3 className="font-headline font-bold text-xl text-foreground">Penny-Perfect Math</h3>
                <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">
                  Our deterministic rounding system distributes every cent fairly — even when numbers don't divide evenly. No confusion, no arguments.
                </p>
              </div>
              <ul className="space-y-2 mt-auto" role="list" aria-label="Penny-Perfect Math highlights">
                {[
                  'Handles discounts & service fees',
                  'Multi-person item shares',
                  'Tax & tip, calculated correctly',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground font-body">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          </div>
        </motion.section>

        {/* ── Works Everywhere ─────────────────────────────────────────────── */}
        <motion.section
          aria-labelledby="cross-platform-heading"
          className="container mx-auto px-4 py-16 lg:py-24"
          variants={staggerContainer(0.15, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp} className="flex flex-col gap-6 order-2 md:order-1">
              <span className="text-sm font-medium text-primary uppercase tracking-widest font-body">
                Any device
              </span>
              <h2
                id="cross-platform-heading"
                className="font-headline text-3xl font-bold tracking-tight sm:text-4xl text-foreground"
              >
                No phone? No problem.
              </h2>
              <p className="text-base text-muted-foreground font-body leading-relaxed">
                Talli is built for the web, so it works beautifully on desktop, laptop, tablet, or phone — no app download required. Start a split on your phone and finish it on your computer, seamlessly.
              </p>
              <div className="flex items-center gap-2.5">
                <Monitor className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm text-muted-foreground font-body">
                  No download required · Works on every modern browser
                </span>
              </div>
              <Button size="lg" asChild className="self-start">
                <Link href={signupHref}>
                  Start Splitting Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} className="order-1 md:order-2">
              <Image
                src="/images/pinky.png"
                alt="Friends celebrating a shared meal together"
                width={500}
                height={500}
                className="rounded-3xl aspect-square object-cover w-full"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <motion.section
          aria-labelledby="cta-heading"
          className="container mx-auto px-4 pb-16 lg:pb-24"
          variants={staggerContainer(0.15, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            variants={fadeInUp}
            className="rounded-3xl bg-card px-8 py-16 text-center flex flex-col items-center gap-6 shadow-sm dark:shadow-none"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary font-body"
              role="note"
            >
              <Rocket className="h-3 w-3" aria-hidden="true" />
              Invite-only Beta
            </span>

            <h2
              id="cta-heading"
              className="font-headline text-3xl font-bold tracking-tight sm:text-4xl text-foreground max-w-lg"
            >
              Ready to split without the drama?
            </h2>

            <p className="text-muted-foreground font-body max-w-md">
              Precision-engineered for every penny. Fair, transparent, and built for real groups.
            </p>

            <Button size="lg" asChild>
              <Link href={signupHref}>
                Try Talli Now
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>
        </motion.section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <motion.footer
        role="contentinfo"
        className="bg-card py-8 shadow-sm dark:shadow-none"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeIn}
      >
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <p className="order-last md:order-none font-body">
            &copy; {currentYear} Talli. Effortless bill splitting for everyone.
          </p>
          <nav className="flex gap-4" aria-label="Footer navigation">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/policy" className="hover:text-foreground transition-colors">
              Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </motion.footer>

    </div>
  );
}
