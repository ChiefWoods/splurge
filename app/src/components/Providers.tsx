'use client';

import { wrappedFetch } from '@/lib/api';
import { ConfigProvider } from '@/providers/ConfigProvider';
import { ItemProvider } from '@/providers/ItemProvider';
import { OrderProvider } from '@/providers/OrderProvider';
import { ReviewProvider } from '@/providers/ReviewProvider';
import { ShopperProvider } from '@/providers/ShopperProvider';
import { SolanaProvider } from '@/providers/SolanaProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import Header from './Header';

export default function Providers({ children }: { children: ReactNode }) {
  return (
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
                    {children}
                  </ReviewProvider>
                </OrderProvider>
              </ItemProvider>
            </StoreProvider>
          </ShopperProvider>
        </ConfigProvider>
      </SolanaProvider>
    </SWRConfig>
  );
}
