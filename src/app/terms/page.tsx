'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function TermsPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setLastUpdated(new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
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
      <main
        className="flex-1"
      >
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-12">
              <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">Terms and Conditions</h1>
              <p className="text-muted-foreground">
                {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
              </p>
            </div>
            
            <motion.div
              className="space-y-8 text-lg text-foreground/80"
              variants={staggerContainer(0.1, 0.1)}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={fadeInUp}>
                <p>
                    Please read these terms and conditions carefully before using Our Service.
                </p>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="space-y-3">
                <h3 className="font-headline text-2xl font-semibold text-foreground">Acknowledgment</h3>
                <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and Talli. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-3">
                <h3 className="font-headline text-2xl font-semibold text-foreground">User Accounts</h3>
                <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
                <p>You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password.</p>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="space-y-3">
                <h3 className="font-headline text-2xl font-semibold text-foreground">AI and User Responsibility</h3>
                <p>The AI features for receipt scanning are provided for your convenience and may not always be 100% accurate. You are responsible for verifying the extracted information and ensuring all calculations are correct before settling payments with others. Talli is not liable for inaccuracies in AI-scanned data or calculation errors resulting from it.</p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">Limitation of Liability</h3>
                <p>To the maximum extent permitted by applicable law, in no event shall Talli or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service).</p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">"AS IS" and "AS AVAILABLE" Disclaimer</h3>
                <p>The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, Talli, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service.</p>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">Changes to These Terms and Conditions</h3>
                <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide reasonable notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
            <Logo />
            <p className="order-last md:order-none">&copy; {currentYear} Talli. All rights reserved.</p>
            <nav className="flex gap-4">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/policy" className="hover:text-foreground transition-colors">Policy</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
