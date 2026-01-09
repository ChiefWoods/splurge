'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { SplurgeClient } from '@/classes/SplurgeClient';

interface ShopperContextType {
  shopperData: ParsedShopper | undefined;
  shopperLoading: boolean;
  shopperMutate: KeyedMutator<ParsedShopper>;
}

const ShopperContext = createContext<ShopperContextType>(
  {} as ShopperContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/shoppers`;

export function useShopper() {
  return useContext(ShopperContext);
}

export function ShopperProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  const {
    data: shopperData,
    isLoading: shopperLoading,
    mutate: shopperMutate,
  } = useSWR(
    publicKey
      ? { pda: SplurgeClient.getShopperPda(publicKey).toBase58() }
      : null,
    async ({ pda }) => {
      const url = new URL(apiEndpoint);

      if (pda) url.searchParams.append('pda', pda);

      const shopper = (await wrappedFetch(url.href)).shopper as ParsedShopper;

      return shopper;
    }
  );

  return (
    <ShopperContext.Provider
      value={{
        shopperData,
        shopperLoading,
        shopperMutate,
      }}
    >
      {children}
    </ShopperContext.Provider>
  );
}
