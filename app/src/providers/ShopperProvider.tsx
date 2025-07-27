'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { getShopperPda } from '@/lib/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import useSWRMutation, { TriggerWithoutArgs } from 'swr/mutation';

interface ShopperContextType {
  allShoppers: ParsedShopper[] | undefined;
  shopper: ParsedShopper | undefined;
  allShoppersMutating: boolean;
  shopperLoading: boolean;
  allShoppersError: Error | undefined;
  shopperError: Error | undefined;
  triggerAllShoppers: TriggerWithoutArgs;
  mutateShopper: KeyedMutator<ParsedShopper>;
}

const ShopperContext = createContext<ShopperContextType>(
  {} as ShopperContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/shoppers`;

export function useShopper() {
  return useContext(ShopperContext);
}

export function ShopperProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const {
    data: allShoppers,
    isMutating: allShoppersMutating,
    error: allShoppersError,
    trigger: triggerAllShoppers,
  } = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).shoppers as ParsedShopper[];
  });

  const {
    data: shopper,
    isLoading: shopperLoading,
    error: shopperError,
    mutate: mutateShopper,
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
        allShoppers,
        shopper,
        allShoppersMutating,
        shopperLoading,
        allShoppersError,
        shopperError,
        triggerAllShoppers,
        mutateShopper,
      }}
    >
      {children}
    </ShopperContext.Provider>
  );
}
