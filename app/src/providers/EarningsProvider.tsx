'use client';

import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { wrappedFetch } from '@/lib/api';

interface Earning {
  mint: string;
  ata: string;
  amount: number;
}

interface EarningsContextType {
  earningsData: Earning[] | undefined;
  earningsLoading: boolean;
  earningsMutate: KeyedMutator<Earning[]>;
}

const EarningsContext = createContext<EarningsContextType>(
  {} as EarningsContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/earnings`;

export function useEarnings() {
  return useContext(EarningsContext);
}

export function EarningsProvider({
  children,
  fallbackData,
  store,
}: {
  children: ReactNode;
  fallbackData: Earning[];
  store: string;
}) {
  const {
    data: earningsData,
    isLoading: earningsLoading,
    mutate: earningsMutate,
  } = useSWR(
    'earnings',
    async () => {
      const url = new URL(apiEndpoint);

      url.searchParams.append('store', store);

      const earnings = (await wrappedFetch(url.href)).earnings as Earning[];

      return earnings;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    }
  );

  return (
    <EarningsContext.Provider
      value={{
        earningsData,
        earningsLoading,
        earningsMutate,
      }}
    >
      {children}
    </EarningsContext.Provider>
  );
}
