'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface StoreContextType {
  storeData: ParsedStore | undefined;
  storeLoading: boolean;
  storeMutate: KeyedMutator<ParsedStore>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({
  children,
  pda,
}: {
  children: ReactNode;
  pda: string;
}) {
  const {
    data: storeData,
    isLoading: storeLoading,
    mutate: storeMutate,
  } = useSWR('store', async () => {
    const url = new URL(apiEndpoint);

    if (pda) url.searchParams.append('pda', pda);

    const store = (await wrappedFetch(url.href)).store as ParsedStore;

    return store;
  });

  return (
    <StoreContext.Provider
      value={{
        storeData,
        storeLoading,
        storeMutate,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
