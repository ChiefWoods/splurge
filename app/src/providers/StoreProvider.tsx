'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';
import useSWR, { SWRResponse } from 'swr';
import { useWallet } from '@solana/wallet-adapter-react';
import { getStorePda } from '@/lib/pda';

interface StoreContextType {
  allStores: SWRMutationResponse<ParsedStore[], any, string, never>;
  store: SWRMutationResponse<
    ParsedStore,
    any,
    string,
    {
      publicKey: string;
    }
  >;
  personalStore: SWRResponse<ParsedStore, any, any>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();

  const allStores = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).stores as ParsedStore[];
  });

  const store = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .store as ParsedStore;
    }
  );

  const personalStore = useSWR(
    publicKey ? { url: apiEndpoint, publicKey } : null,
    async ({ url, publicKey }) => {
      return (
        await wrappedFetch(`${url}?pda=${getStorePda(publicKey).toBase58()}`)
      ).store as ParsedStore;
    }
  );

  return (
    <StoreContext.Provider
      value={{
        allStores,
        store,
        personalStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
