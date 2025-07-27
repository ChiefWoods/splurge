'use client';

import { ParsedItem } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface ItemContextType {
  allItems: ParsedItem[] | undefined;
  item: ParsedItem | undefined;
  allItemsMutating: boolean;
  itemMutating: boolean;
  allItemsError: Error | undefined;
  itemError: Error | undefined;
  triggerAllItems: TriggerWithArgs<
    ParsedItem[],
    any,
    string,
    { storePda?: string | undefined }
  >;
  triggerItem: TriggerWithArgs<ParsedItem, any, string, { publicKey: string }>;
}

const ItemContext = createContext<ItemContextType>({} as ItemContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/items`;

export function useItem() {
  return useContext(ItemContext);
}

export function ItemProvider({ children }: { children: ReactNode }) {
  const {
    data: allItems,
    isMutating: allItemsMutating,
    error: allItemsError,
    trigger: triggerAllItems,
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
    data: item,
    isMutating: itemMutating,
    error: itemError,
    trigger: triggerItem,
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
        allItems,
        item,
        allItemsMutating,
        itemMutating,
        allItemsError,
        itemError,
        triggerAllItems,
        triggerItem,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}
