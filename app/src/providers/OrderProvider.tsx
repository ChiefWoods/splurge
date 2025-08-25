'use client';

import { ParsedOrder } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

interface OrderContextType {
  allOrders: SWRMutationResponse<
    ParsedOrder[],
    any,
    string,
    {
      shopperPda?: string;
      storePda?: string;
    }
  >;
  order: SWRMutationResponse<
    ParsedOrder,
    any,
    string,
    {
      publicKey: string;
    }
  >;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/orders`;

export function useOrder() {
  return useContext(OrderContext);
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const allOrders = useSWRMutation(
    apiEndpoint,
    async (
      url,
      { arg }: { arg: { shopperPda?: string; storePda?: string } }
    ) => {
      const { shopperPda, storePda } = arg;

      const newUrl = new URL(url);

      if (shopperPda) {
        newUrl.searchParams.append('shopper', shopperPda);
      }

      if (storePda) {
        newUrl.searchParams.append('store', storePda);
      }

      return (await wrappedFetch(newUrl.href)).orders as ParsedOrder[];
    }
  );

  const order = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .order as ParsedOrder;
    }
  );

  return (
    <OrderContext.Provider
      value={{
        allOrders,
        order,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
