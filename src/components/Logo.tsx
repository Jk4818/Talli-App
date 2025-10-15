import Link from 'next/link';
import React from 'react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Talli Home">
      <h1 className="text-2xl font-black font-headline text-foreground tracking-tighter">talli</h1>
    </Link>
  );
}
