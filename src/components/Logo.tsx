import { ReceiptText } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Talli Home">
      <ReceiptText className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-foreground">Talli</h1>
    </Link>
  );
}
