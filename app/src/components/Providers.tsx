import { SolanaProvider } from '@/providers/SolanaProvider';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { TooltipProvider } from './ui/tooltip';
import { PythProvider } from '@/providers/PythProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { ShopperProvider } from '@/providers/ShopperProvider';
import { StoreProvider } from '@/providers/StoreProvider';

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
                <ShopperProvider>
                  <StoreProvider>{children}</StoreProvider>
                </ShopperProvider>
              </PythProvider>
            </SolanaProvider>
          </SettingsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
