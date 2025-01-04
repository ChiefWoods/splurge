import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { SolanaProvider } from '@/components/SolanaProvider';
import Header from '@/components/Header';
import { SWRConfig } from 'swr';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Splurge',
  description: 'Splurge on Solana',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
      >
        <SWRConfig value={{ suspense: false, revalidateOnFocus: false }}>
          <SolanaProvider>
            <Header />
            <main className="flex flex-col">{children}</main>
          </SolanaProvider>
        </SWRConfig>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
