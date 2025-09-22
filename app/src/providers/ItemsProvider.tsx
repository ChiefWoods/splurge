'use client';

import { ParsedItem } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ItemsContextType {
  itemsData: ParsedItem[] | undefined;
  itemsLoading: boolean;
  itemsMutate: KeyedMutator<ParsedItem[]>;
}

const ItemsContext = createContext<ItemsContextType>({} as ItemsContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/items`;

export function useItems() {
  return useContext(ItemsContext);
}

export function ItemsProvider({
  children,
  storePda,
}: {
  children: ReactNode;
  storePda?: string;
}) {
  const {
    data: itemsData,
    isLoading: itemsLoading,
    mutate: itemsMutate,
  } = useSWR({ apiEndpoint, storePda }, async ({ apiEndpoint, storePda }) => {
    const newUrl = new URL(apiEndpoint);

    if (storePda) {
      newUrl.searchParams.append('store', storePda);
    }

    return (await wrappedFetch(newUrl.href)).items as ParsedItem[];
  });

  return (
    <ItemsContext.Provider
      value={{
        itemsData,
        itemsLoading,
        itemsMutate,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}
