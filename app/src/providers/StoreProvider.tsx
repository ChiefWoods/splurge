'use client';

import { ParsedStore, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, {
  TriggerWithArgs,
  TriggerWithoutArgs,
} from 'swr/mutation';

interface StoreContextType {
  allStores: ParsedProgramAccount<ParsedStore>[] | undefined;
  store: ParsedProgramAccount<ParsedStore> | undefined;
  allStoresMutating: boolean;
  storeMutating: boolean;
  allStoresError: Error | undefined;
  storeError: Error | undefined;
  triggerAllStores: TriggerWithoutArgs;
  triggerStore: TriggerWithArgs<
    ParsedProgramAccount<ParsedStore>,
    any,
    string,
    { publicKey: string }
  >;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const url = '/api/accounts/stores';

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const {
    data: allStores,
    isMutating: allStoresMutating,
    error: allStoresError,
    trigger: triggerAllStores,
  } = useSWRMutation(url, async (url) => {
    return (await defaultFetcher(url))
      .stores as ParsedProgramAccount<ParsedStore>[];
  });

  const {
    data: store,
    isMutating: storeMutating,
    error: storeError,
    trigger: triggerStore,
  } = useSWRMutation(
    url,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await defaultFetcher(`${url}?pda=${arg.publicKey}`))
        .store as ParsedProgramAccount<ParsedStore>;
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
