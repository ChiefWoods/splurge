"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { findStorePda } from "@splurge/sdk";
import { createContext, ReactNode, use, useMemo } from "react";
import useSWR, { KeyedMutator } from "swr";

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
  return use(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  const {
    data: storeData,
    isLoading: storeLoading,
    mutate: storeMutate,
  } = useSWR(
    publicKey ? { pda: findStorePda({ authority: publicKey })[0].toBase58() } : null,
    async ({ pda }) => {
      const url = new URL(apiEndpoint);

      if (pda) url.searchParams.append("pda", pda);

      const store = (await wrappedFetch(url.href)).store as ParsedStore;

      return store;
    },
  );
  const value = useMemo(
    () => ({
      storeData,
      storeLoading,
      storeMutate,
    }),
    [storeData, storeLoading, storeMutate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
