'use client';

import { ParsedOrder } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface OrderContextType {
  allOrders: ParsedOrder[] | undefined;
  order: ParsedOrder | undefined;
  allOrdersMutating: boolean;
  orderMutating: boolean;
  allOrdersError: Error | undefined;
  orderError: Error | undefined;
  triggerAllOrders: TriggerWithArgs<
    ParsedOrder[],
    any,
    string,
    { shopperPda?: string | undefined; storePda?: string | undefined }
  >;
  triggerOrder: TriggerWithArgs<
    ParsedOrder,
    any,
    string,
    { publicKey: string }
  >;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/orders`;

export function useOrder() {
  return useContext(OrderContext);
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const {
    data: allOrders,
    isMutating: allOrdersMutating,
    error: allOrdersError,
    trigger: triggerAllOrders,
  } = useSWRMutation(
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

  const {
    data: order,
    isMutating: orderMutating,
    error: orderError,
    trigger: triggerOrder,
  } = useSWRMutation(
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
        allOrdersMutating,
        orderMutating,
        allOrdersError,
        orderError,
        triggerAllOrders,
        triggerOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
