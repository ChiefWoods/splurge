'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { getShopperPda } from '@/lib/pda';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import useSWRMutation, { TriggerWithoutArgs } from 'swr/mutation';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

interface ShopperContextType {
  allShoppersData: ParsedShopper[] | undefined;
  allShoppersIsMutating: boolean;
  allShoppersTrigger: TriggerWithoutArgs<ParsedShopper[], any, string, never>;
  shopperData: ParsedShopper | undefined;
  shopperIsLoading: boolean;
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
    data: allShoppersData,
    isMutating: allShoppersIsMutating,
    trigger: allShoppersTrigger,
  } = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).shoppers as ParsedShopper[];
  });

  const {
    data: shopperData,
    isLoading: shopperIsLoading,
    mutate: shopperMutate,
  } = useSWR(
    publicKey ? { url: apiEndpoint, publicKey } : null,
    async ({ url, publicKey }) => {
      return (
        await wrappedFetch(`${url}?pda=${getShopperPda(publicKey).toBase58()}`)
      ).shopper as ParsedShopper;
    }
  );

  return (
    <ShopperContext.Provider
      value={{
        allShoppersData,
        allShoppersIsMutating,
        allShoppersTrigger,
        shopperData,
        shopperIsLoading,
        shopperMutate,
      }}
    >
      {children}
    </ShopperContext.Provider>
  );
}
