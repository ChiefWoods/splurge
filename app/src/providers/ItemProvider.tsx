"use client";

import { createContext, ReactNode, use, useMemo } from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedItem } from "@/types/accounts";

interface ItemContextType {
  itemData: ParsedItem | undefined;
  itemLoading: boolean;
  itemMutate: KeyedMutator<ParsedItem>;
}

const ItemContext = createContext<ItemContextType>({} as ItemContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/items`;

function useItem() {
  return use(ItemContext);
}

export function ItemProvider({
  children,
  fallbackData,
}: {
  children: ReactNode;
  fallbackData: ParsedItem;
}) {
  const {
    data: itemData,
    isLoading: itemLoading,
    mutate: itemMutate,
  } = useSWR(
    "item",
    async () => {
      const url = new URL(apiEndpoint);

      url.searchParams.append("pda", fallbackData.address);

      const itemAcc = (await wrappedFetch(url.href)).item as ParsedItem;

      return itemAcc;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    },
  );
  const value = useMemo(
    () => ({
      itemData,
      itemLoading,
      itemMutate,
    }),
    [itemData, itemLoading, itemMutate],
  );

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}
