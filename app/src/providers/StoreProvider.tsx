"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createContext, ReactNode, useContext } from "react";
import useSWR, { KeyedMutator } from "swr";

import { SplurgeClient } from "@/classes/SplurgeClient";
import { wrappedFetch } from "@/lib/api";
import { ParsedStore } from "@/types/accounts";

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

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  const {
    data: storeData,
    isLoading: storeLoading,
    mutate: storeMutate,
  } = useSWR(
    publicKey ? { pda: SplurgeClient.getStorePda(publicKey).toBase58() } : null,
    async ({ pda }) => {
      const url = new URL(apiEndpoint);

      if (pda) url.searchParams.append("pda", pda);

      const store = (await wrappedFetch(url.href)).store as ParsedStore;

      return store;
    },
  );

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
