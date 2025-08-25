'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { getShopperPda } from '@/lib/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { SWRResponse } from 'swr';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

interface ShopperContextType {
  allShoppers: SWRMutationResponse<ParsedShopper[], any, string, never>;
  shopper: SWRResponse<ParsedShopper, any, any>;
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

  const allShoppers = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).shoppers as ParsedShopper[];
  });

  const shopper = useSWR(
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
      }}
    >
      {children}
    </ShopperContext.Provider>
  );
}
