'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useProgram } from './ProgramProvider';

interface PersonalStoreContextType {
  personalStoreData: ParsedStore | undefined;
  personalStoreLoading: boolean;
  personalStoreMutate: KeyedMutator<ParsedStore>;
}

const PersonalStoreContext = createContext<PersonalStoreContextType>(
  {} as PersonalStoreContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function usePersonalStore() {
  return useContext(PersonalStoreContext);
}

export function PersonalStoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();
  const { splurgeClient } = useProgram();

  const {
    data: personalStoreData,
    isLoading: personalStoreLoading,
    mutate: personalStoreMutate,
  } = useSWR(
    publicKey
      ? { apiEndpoint, pda: splurgeClient.getStorePda(publicKey).toBase58() }
      : null,
    async ({ apiEndpoint, pda }) => {
      return (await wrappedFetch(`${apiEndpoint}?pda=${pda}`))
        .store as ParsedStore;
    }
  );

  return (
    <PersonalStoreContext.Provider
      value={{
        personalStoreData,
        personalStoreLoading,
        personalStoreMutate,
      }}
    >
      {children}
    </PersonalStoreContext.Provider>
  );
}
