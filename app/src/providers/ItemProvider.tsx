'use client';

import { ParsedItem } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

interface ItemContextType {
  allItems: SWRMutationResponse<
    ParsedItem[],
    any,
    string,
    {
      storePda?: string;
    }
  >;
  item: SWRMutationResponse<
    ParsedItem,
    any,
    string,
    {
      publicKey: string;
    }
  >;
}

const ItemContext = createContext<ItemContextType>({} as ItemContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/items`;

export function useItem() {
  return useContext(ItemContext);
}

export function ItemProvider({ children }: { children: ReactNode }) {
  const allItems = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { storePda?: string } }) => {
      const { storePda } = arg;

      const newUrl = new URL(url);

      if (storePda) {
        newUrl.searchParams.append('store', storePda);
      }

      return (await wrappedFetch(newUrl.href)).items as ParsedItem[];
    }
  );

  const item = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .item as ParsedItem;
    }
  );

  return (
    <ItemContext.Provider
      value={{
        allItems,
        item,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}
