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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        suspense: false,
        revalidateOnFocus: false,
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
              <PythProvider>
                <ConfigProvider>
                  <ShopperProvider>
                    <PersonalStoreProvider>{children}</PersonalStoreProvider>
                  </ShopperProvider>
                </ConfigProvider>
              </PythProvider>
            </SolanaProvider>
          </SettingsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
