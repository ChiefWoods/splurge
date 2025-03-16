'use client';

import { ParsedShopper, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { getShopperPda } from '@/lib/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import useSWRMutation, { TriggerWithoutArgs } from 'swr/mutation';

interface ShopperContextType {
  allShoppers: ParsedProgramAccount<ParsedShopper>[] | undefined;
  shopper: ParsedProgramAccount<ParsedShopper> | undefined;
  allShoppersMutating: boolean;
  shopperLoading: boolean;
  allShoppersError: Error | undefined;
  shopperError: Error | undefined;
  triggerAllShoppers: TriggerWithoutArgs;
  mutateShopper: KeyedMutator<ParsedProgramAccount<ParsedShopper>>;
}

const ShopperContext = createContext<ShopperContextType>(
  {} as ShopperContextType
);

const url = '/api/accounts/shoppers';

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
  } = useSWRMutation(url, async (url) => {
    return (await defaultFetcher(url))
      .shoppers as ParsedProgramAccount<ParsedShopper>[];
  });

  const {
    data: shopper,
    isLoading: shopperLoading,
    error: shopperError,
    mutate: mutateShopper,
  } = useSWR(
    publicKey ? { url, publicKey } : null,
    async ({ url, publicKey }) => {
      return (
        await defaultFetcher(
          `${url}?pda=${getShopperPda(publicKey).toBase58()}`
        )
      ).shopper as ParsedProgramAccount<ParsedShopper>;
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
