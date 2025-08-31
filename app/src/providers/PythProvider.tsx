'use client';

import { ACCEPTED_MINTS_METADATA, HERMES_CLIENT } from '@/lib/constants';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface Price {
  mint: string;
  price: number;
}

interface PythContextType {
  pricesData: Price[] | undefined;
  pricesIsLoading: boolean;
  pricesMutate: KeyedMutator<
    {
      mint: string;
      price: number;
    }[]
  >;
}

const PythContext = createContext<PythContextType>({} as PythContextType);

export function usePyth() {
  return useContext(PythContext);
}

export function PythProvider({ children }: { children: ReactNode }) {
  const {
    data: pricesData,
    isLoading: pricesIsLoading,
    mutate: pricesMutate,
  } = useSWR('pyth', async () => {
    // TODO: id should be stored and fetched from config account
    const ids = Array.from(ACCEPTED_MINTS_METADATA.values()).map(
      (metadata) => metadata.id
    );

    const priceUpdates = await HERMES_CLIENT.getLatestPriceUpdates(ids);

    if (!priceUpdates.parsed) {
      throw new Error('Unable to get parsed price updates.');
    }

    return priceUpdates.parsed.map((update, i) => {
      return {
        mint: Array.from(ACCEPTED_MINTS_METADATA.keys())[i],
        price: Number(update.price.price) * 10 ** update.price.expo,
      };
    });
  });

  return (
    <PythContext.Provider
      value={{
        pricesData,
        pricesIsLoading,
        pricesMutate,
      }}
    >
      {children}
    </PythContext.Provider>
  );
}
