'use client';

import { ParsedOrder } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface OrdersContextType {
  ordersData: ParsedOrder[] | undefined;
  ordersLoading: boolean;
  ordersMutate: KeyedMutator<ParsedOrder[]>;
}

const OrdersContext = createContext<OrdersContextType>({} as OrdersContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/orders`;

export function useOrders() {
  return useContext(OrdersContext);
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
    'orders',
    async () => {
      const url = new URL(apiEndpoint);

      if (shopper) url.searchParams.append('shopper', shopper);
      if (store) url.searchParams.append('store', store);

      const orders = (await wrappedFetch(url.href)).orders as ParsedOrder[];

      return orders;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    }
  );

  return (
    <OrdersContext.Provider
      value={{
        ordersData,
        ordersLoading,
        ordersMutate,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}
