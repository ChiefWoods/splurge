import type { Metadata } from 'next';
import { Moderustic } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';

const moderustic = Moderustic({
  variable: '--font-moderustic',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Splurge',
  description: 'On-chain e-commerce platform on Solana.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${moderustic.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers>
          <Header />
          <main className="flex flex-1 flex-col items-center">{children}</main>
        </Providers>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
