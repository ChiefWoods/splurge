'use client';

import { ParsedOrder, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface OrderContextType {
  allOrders: ParsedProgramAccount<ParsedOrder>[] | undefined;
  order: ParsedProgramAccount<ParsedOrder> | undefined;
  allOrdersMutating: boolean;
  orderMutating: boolean;
  allOrdersError: Error | undefined;
  orderError: Error | undefined;
  triggerAllOrders: TriggerWithArgs<
    ParsedProgramAccount<ParsedOrder>[],
    any,
    string,
    { shopperPda?: string | undefined; storePda?: string | undefined }
  >;
  triggerOrder: TriggerWithArgs<
    ParsedProgramAccount<ParsedOrder>,
    any,
    string,
    { publicKey: string }
  >;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

const url = '/api/accounts/orders';

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
    url,
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

      return (await defaultFetcher(newUrl.href))
        .orders as ParsedProgramAccount<ParsedOrder>[];
    }
  );

  const {
    data: order,
    isMutating: orderMutating,
    error: orderError,
    trigger: triggerOrder,
  } = useSWRMutation(
    url,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await defaultFetcher(`${url}?pda=${arg.publicKey}`))
        .order as ParsedProgramAccount<ParsedOrder>;
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
