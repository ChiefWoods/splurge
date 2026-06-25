"use client";

import { createContext, ReactNode, use, useMemo } from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedOrder } from "@/types/accounts";

interface OrdersContextType {
  ordersData: ParsedOrder[] | undefined;
  ordersLoading: boolean;
  ordersMutate: KeyedMutator<ParsedOrder[]>;
}

const OrdersContext = createContext<OrdersContextType>({} as OrdersContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/orders`;

export function useOrders() {
  return use(OrdersContext);
}

export function OrdersProvider({
  children,
  fallbackData,
  shopper,
  store,
}: {
  children: ReactNode;
  fallbackData: ParsedOrder[];
  shopper?: string;
  store?: string;
}) {
  const {
    data: ordersData,
    isLoading: ordersLoading,
    mutate: ordersMutate,
  } = useSWR(
    "orders",
    async () => {
      const url = new URL(apiEndpoint);

      if (shopper) url.searchParams.append("shopper", shopper);
      if (store) url.searchParams.append("store", store);

      const orders = (await wrappedFetch(url.href)).orders as ParsedOrder[];

      return orders;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    },
  );
  const value = useMemo(
    () => ({
      ordersData,
      ordersLoading,
      ordersMutate,
    }),
    [ordersData, ordersLoading, ordersMutate],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
