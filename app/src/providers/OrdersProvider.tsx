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
  shopperPda,
  storePda,
}: {
  children: ReactNode;
  shopperPda?: string;
  storePda?: string;
}) {
  const {
    data: ordersData,
    isLoading: ordersLoading,
    mutate: ordersMutate,
  } = useSWR(
    { apiEndpoint, shopperPda, storePda },
    async ({ apiEndpoint, shopperPda, storePda }) => {
      const newUrl = new URL(apiEndpoint);

      if (shopperPda) {
        newUrl.searchParams.append('shopper', shopperPda);
      }

      if (storePda) {
        newUrl.searchParams.append('store', storePda);
      }

      return (await wrappedFetch(newUrl.href)).orders as ParsedOrder[];
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
