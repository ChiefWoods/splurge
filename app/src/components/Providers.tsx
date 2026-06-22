import { ReactNode } from "react";
import { SWRConfig } from "swr";

import { PythProvider } from "@/providers/PythProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { ShopperProvider } from "@/providers/ShopperProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { StoreProvider } from "@/providers/StoreProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { TooltipProvider } from "./ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        suspense: false,
        revalidateOnFocus: false,
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
