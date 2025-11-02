'use client';

import { wrappedFetch } from '@/lib/api';
import { ConfigProvider } from '@/providers/ConfigProvider';
import { ShopperProvider } from '@/providers/ShopperProvider';
import { SolanaProvider } from '@/providers/SolanaProvider';
import { PersonalStoreProvider } from '@/providers/PersonalStoreProvider';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { TooltipProvider } from './ui/tooltip';
import { PythProvider } from '@/providers/PythProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { ProgramProvider } from '@/providers/ProgramProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        suspense: false,
        revalidateOnFocus: false,
        fetcher: wrappedFetch,
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <SettingsProvider>
            <SolanaProvider>
              <ProgramProvider>
                <PythProvider>
                  <ConfigProvider>
                    <ShopperProvider>
                      <PersonalStoreProvider>{children}</PersonalStoreProvider>
                    </ShopperProvider>
                  </ConfigProvider>
                </PythProvider>
              </ProgramProvider>
            </SolanaProvider>
          </SettingsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
