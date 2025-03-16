'use client';

import { ParsedItem, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface ItemContextType {
  allItems: ParsedProgramAccount<ParsedItem>[] | undefined;
  item: ParsedProgramAccount<ParsedItem> | undefined;
  allItemsMutating: boolean;
  itemMutating: boolean;
  allItemsError: Error | undefined;
  itemError: Error | undefined;
  triggerAllItems: TriggerWithArgs<
    ParsedProgramAccount<ParsedItem>[],
    any,
    string,
    { storePda?: string | undefined }
  >;
  triggerItem: TriggerWithArgs<
    ParsedProgramAccount<ParsedItem>,
    any,
    string,
    { publicKey: string }
  >;
}

const ItemContext = createContext<ItemContextType>({} as ItemContextType);

const url = '/api/accounts/items';

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
    url,
    async (url, { arg }: { arg: { storePda?: string } }) => {
      const { storePda } = arg;

      const newUrl = new URL(url);

      if (storePda) {
        newUrl.searchParams.append('store', storePda);
      }

      return (await defaultFetcher(newUrl.href))
        .items as ParsedProgramAccount<ParsedItem>[];
    }
  );

  const {
    data: item,
    isMutating: itemMutating,
    error: itemError,
    trigger: triggerItem,
  } = useSWRMutation(
    url,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await defaultFetcher(`${url}?pda=${arg.publicKey}`))
        .item as ParsedProgramAccount<ParsedItem>;
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
