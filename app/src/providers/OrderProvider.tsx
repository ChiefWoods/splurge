'use client';

import { ParsedOrder } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface OrderContextType {
  allOrdersData: ParsedOrder[] | undefined;
  allOrdersIsMutating: boolean;
  allOrdersTrigger: TriggerWithArgs<
    ParsedOrder[],
    any,
    string,
    {
      shopperPda?: string;
      storePda?: string;
    }
  >;
  orderData: ParsedOrder | undefined;
  orderIsMutating: boolean;
  orderTrigger: TriggerWithArgs<
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
  const {
    data: allOrdersData,
    isMutating: allOrdersIsMutating,
    trigger: allOrdersTrigger,
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
    data: orderData,
    isMutating: orderIsMutating,
    trigger: orderTrigger,
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
        allOrdersData,
        allOrdersIsMutating,
        allOrdersTrigger,
        orderData,
        orderIsMutating,
        orderTrigger,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
