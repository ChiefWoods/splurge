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
  title: {
    default: 'Splurge',
    template: '%s | Splurge',
  },
  description: 'On-chain e-commerce platform on Solana.',
  icons: {
    icon: [
      {
        url: '/favicon-dark.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-light.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon-light.svg',
        media: '(prefers-color-scheme: no-preference)',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${moderustic.variable} flex min-h-screen flex-col items-center antialiased`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
