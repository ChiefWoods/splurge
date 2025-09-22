'use client';

import { ParsedShopper } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ShoppersContextType {
  shoppersData: ParsedShopper[] | undefined;
  shoppersLoading: boolean;
  shoppersMutate: KeyedMutator<ParsedShopper[]>;
}

const ShoppersContext = createContext<ShoppersContextType>(
  {} as ShoppersContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/shoppers`;

export function useShoppers() {
  return useContext(ShoppersContext);
}

export function ShoppersProvider({ children }: { children: ReactNode }) {
  const {
    data: shoppersData,
    isLoading: shoppersLoading,
    mutate: shoppersMutate,
  } = useSWR(apiEndpoint, async (apiEndpoint) => {
    return (await wrappedFetch(apiEndpoint)).shoppers as ParsedShopper[];
  });

  return (
    <ShoppersContext.Provider
      value={{
        shoppersData,
        shoppersLoading,
        shoppersMutate,
      }}
    >
      {children}
    </ShoppersContext.Provider>
  );
}
