"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { findShopperPda } from "@splurge/sdk";
import { createContext, ReactNode, use, useMemo } from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedShopper } from "@/types/accounts";

interface ShopperContextType {
  shopperData: ParsedShopper | undefined;
  shopperLoading: boolean;
  shopperMutate: KeyedMutator<ParsedShopper>;
}

const ShopperContext = createContext<ShopperContextType>({} as ShopperContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/shoppers`;

export function useShopper() {
  return use(ShopperContext);
}

export function ShopperProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  const {
    data: shopperData,
    isLoading: shopperLoading,
    mutate: shopperMutate,
  } = useSWR(
    publicKey ? { pda: findShopperPda({ authority: publicKey })[0].toBase58() } : null,
    async ({ pda }) => {
      const url = new URL(apiEndpoint);

      if (pda) url.searchParams.append("pda", pda);

      const shopper = (await wrappedFetch(url.href)).shopper as ParsedShopper;

      return shopper;
    },
  );
  const value = useMemo(
    () => ({
      shopperData,
      shopperLoading,
      shopperMutate,
    }),
    [shopperData, shopperLoading, shopperMutate],
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
}
