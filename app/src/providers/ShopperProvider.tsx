'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { getShopperPda } from '@/lib/pda';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

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
      ? { apiEndpoint, pda: getShopperPda(publicKey).toBase58() }
      : null,
    async ({ apiEndpoint, pda }) => {
      return (await wrappedFetch(`${apiEndpoint}?pda=${pda}`))
        .shopper as ParsedShopper;
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
