'use client';

import { ParsedItem } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ItemContextType {
  itemData: ParsedItem | undefined;
  itemLoading: boolean;
  itemMutate: KeyedMutator<ParsedItem>;
}

const ItemContext = createContext<ItemContextType>({} as ItemContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/items`;

export function useItem() {
  return useContext(ItemContext);
}

export function ItemProvider({
  children,
  pda,
}: {
  children: ReactNode;
  pda: string;
}) {
  const {
    data: itemData,
    isLoading: itemLoading,
    mutate: itemMutate,
  } = useSWR('item', async () => {
    const url = new URL(apiEndpoint);

    if (pda) url.searchParams.append('pda', pda);

    const item = (await wrappedFetch(url.href)).item as ParsedItem;

    return item;
  });

  return (
    <ItemContext.Provider
      value={{
        itemData,
        itemLoading,
        itemMutate,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}
