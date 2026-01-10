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
  fallbackData,
  store,
}: {
  children: ReactNode;
  fallbackData: ParsedItem[];
  store?: string;
}) {
  const {
    data: itemsData,
    isLoading: itemsLoading,
    mutate: itemsMutate,
  } = useSWR(
    'items',
    async () => {
      const url = new URL(apiEndpoint);

      if (store) {
        url.searchParams.append('store', store);
      }

      const items = (await wrappedFetch(url.href)).items as ParsedItem[];

      return items;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    }
  );

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
