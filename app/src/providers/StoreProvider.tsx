'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, {
  TriggerWithArgs,
  TriggerWithoutArgs,
} from 'swr/mutation';

interface StoreContextType {
  allStores: ParsedStore[] | undefined;
  store: ParsedStore | undefined;
  allStoresMutating: boolean;
  storeMutating: boolean;
  allStoresError: Error | undefined;
  storeError: Error | undefined;
  triggerAllStores: TriggerWithoutArgs;
  triggerStore: TriggerWithArgs<
    ParsedStore,
    any,
    string,
    { publicKey: string }
  >;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const {
    data: allStores,
    isMutating: allStoresMutating,
    error: allStoresError,
    trigger: triggerAllStores,
  } = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).stores as ParsedStore[];
  });

  const {
    data: store,
    isMutating: storeMutating,
    error: storeError,
    trigger: triggerStore,
  } = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .store as ParsedStore;
    }
  );

  return (
    <StoreContext.Provider
      value={{
        allStores,
        store,
        allStoresMutating,
        storeMutating,
        allStoresError,
        storeError,
        triggerAllStores,
        triggerStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
