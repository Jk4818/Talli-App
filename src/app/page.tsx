import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart, Users, UploadCloud, Divide } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Image from 'next/image';
import ImportButton from '@/components/app/ImportButton';

export default function Home() {
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/demo">Demo</Link>
            </Button>
            <ImportButton variant="ghost" />
            <Button asChild>
              <Link href="/app">
                Split Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center lg:py-28">
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop arguing over the bill.
            <br />
            <span className="text-primary">Split it with AI.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Splitzy makes group expenses simple. Upload a receipt, assign items, and we'll tell you exactly who owes what. Fair, fast, and free.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/app">
                Start Splitting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Try a Live Demo</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/50 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">How It Works</div>
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">From Receipt to Resolution in 3 Steps</h2>
                <p className="text-muted-foreground">
                  Splitting a bill has never been easier. Our streamlined process saves you time and prevents awkward "who had what" conversations.
                </p>
              </div>
              <div className="relative">
                <Image 
                  src="https://placehold.co/1200x800.png" 
                  alt="A phone showing the Splitzy app interface with a receipt being scanned."
                  data-ai-hint="receipt phone app"
                  width={1200}
                  height={800}
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
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
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p>&copy; {new Date().getFullYear()} Splitzy. Effortless bill splitting for everyone.</p>
        </div>
      </footer>
    </div>
  );
}
