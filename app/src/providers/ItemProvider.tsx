'use client';

import { ParsedItem } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface ItemContextType {
  allItemsData: ParsedItem[] | undefined;
  allItemsIsMutating: boolean;
  allItemsTrigger: TriggerWithArgs<
    ParsedItem[],
    any,
    string,
    {
      storePda?: string;
    }
  >;
  itemData: ParsedItem | undefined;
  itemIsMutating: boolean;
  itemTrigger: TriggerWithArgs<
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
  const {
    data: allItemsData,
    isMutating: allItemsIsMutating,
    trigger: allItemsTrigger,
  } = useSWRMutation(
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

  const {
    data: itemData,
    isMutating: itemIsMutating,
    trigger: itemTrigger,
  } = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .item as ParsedItem;
    }
  );

  return (
    <ItemContext.Provider
      value={{
        allItemsData,
        allItemsIsMutating,
        allItemsTrigger,
        itemData,
        itemIsMutating,
        itemTrigger,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}
