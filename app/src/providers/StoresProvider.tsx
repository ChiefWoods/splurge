'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface StoresContextType {
  storesData: ParsedStore[] | undefined;
  storesLoading: boolean;
  storesMutate: KeyedMutator<ParsedStore[]>;
}

const StoresContext = createContext<StoresContextType>({} as StoresContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStores() {
  return useContext(StoresContext);
}

export function StoresProvider({ children }: { children: ReactNode }) {
  const {
    data: storesData,
    isLoading: storesLoading,
    mutate: storesMutate,
  } = useSWR('stores', async () => {
    const url = new URL(apiEndpoint);

    const stores = (await wrappedFetch(url.href)).stores as ParsedStore[];

    return stores;
  });

  return (
    <StoresContext.Provider
      value={{
        storesData,
        storesLoading,
        storesMutate,
      }}
    >
      {children}
    </StoresContext.Provider>
  );
}
