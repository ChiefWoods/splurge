import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { SolanaProvider } from '@/providers/SolanaProvider';
import Header from '@/components/Header';
import { SWRConfig } from 'swr';
import { Toaster } from '@/components/ui/sonner';
import { wrappedFetch } from '@/lib/api';
import { ConfigProvider } from '@/providers/ConfigProvider';
import { ShopperProvider } from '@/providers/ShopperProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ItemProvider } from '@/providers/ItemProvider';
import { OrderProvider } from '@/providers/OrderProvider';
import { ReviewProvider } from '@/providers/ReviewProvider';

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
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <SWRConfig
          value={{
            suspense: false,
            revalidateOnFocus: false,
            fetcher: wrappedFetch,
          }}
        >
          <SolanaProvider>
            <ConfigProvider>
              <ShopperProvider>
                <StoreProvider>
                  <ItemProvider>
                    <OrderProvider>
                      <ReviewProvider>
                        <Header />
                        <main className="flex flex-1 flex-col items-center">
                          {children}
                        </main>
                      </ReviewProvider>
                    </OrderProvider>
                  </ItemProvider>
                </StoreProvider>
              </ShopperProvider>
            </ConfigProvider>
          </SolanaProvider>
        </SWRConfig>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
