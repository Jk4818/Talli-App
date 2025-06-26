'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PolicyPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setLastUpdated(new Date().toLocaleDateString());
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
            <CardHeader>
              <CardTitle className="text-4xl font-headline">Privacy Policy</CardTitle>
              <CardDescription>Last updated: {lastUpdated}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-foreground/80">
              <p>
                Welcome to Splitzy. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
              </p>
              
              <h3 className="font-headline text-xl font-semibold text-foreground">Information We Collect</h3>
              <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name and email address, that you voluntarily give to us when you register with the Service.</li>
                <li><strong>User Content:</strong> We collect the images of receipts you upload to the Service. These images are processed by our AI to extract transaction data but are not stored long-term on our primary servers after processing.</li>
              </ul>

              <h3 className="font-headline text-xl font-semibold text-foreground">How We Use Your Information</h3>
              <p>Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create and manage your account.</li>
                <li>Process your uploaded receipts using our AI services to provide the core functionality of the app.</li>
                <li>Email you regarding your account or order.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
              </ul>
              
              <h3 className="font-headline text-xl font-semibold text-foreground">Data Security</h3>
              <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
              
              <h3 className="font-headline text-xl font-semibold text-foreground">Third-Party Services</h3>
              <p>We use Firebase for authentication and Google AI for receipt processing. These services have their own privacy policies, and we encourage you to review them.</p>

              <h3 className="font-headline text-xl font-semibold text-foreground">Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
              
              <h3 className="font-headline text-xl font-semibold text-foreground">Contact Us</h3>
              <p>If you have questions or comments about this Privacy Policy, please contact us at support@splitzy.app.</p>

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
