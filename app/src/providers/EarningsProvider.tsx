'use client';

import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { useStore } from './StoreProvider';
import { tryGetTokenAccountBalance } from '@/lib/utils';
import { ParsedConfig } from '@/types/accounts';

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

export function useEarnings() {
  return useContext(EarningsContext);
}

export function EarningsProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: ParsedConfig;
}) {
  const { connection } = useConnection();
  const { storeData, storeLoading } = useStore();

  const {
    data: earningsData,
    isLoading: earningsLoading,
    mutate: earningsMutate,
  } = useSWR(
    config && storeData
      ? {
          acceptedMints: config.acceptedMints,
          storePda: storeData.publicKey,
        }
      : null,
    async ({ acceptedMints, storePda }) => {
      return await Promise.all(
        acceptedMints.map(async ({ mint }) => {
          const mintPubkey = new PublicKey(mint);
          const mintAcc = await connection.getAccountInfo(mintPubkey);

          if (!mintAcc) {
            throw new Error('Mint account not found.');
          }

          const ata = getAssociatedTokenAddressSync(
            mintPubkey,
            new PublicKey(storePda),
            !PublicKey.isOnCurve(storePda),
            mintAcc.owner
          );

          const amount = await tryGetTokenAccountBalance(connection, ata);

          return {
            mint,
            ata: ata.toBase58(),
            amount,
          };
        })
      );
    }
  );

  return (
    <EarningsContext.Provider
      value={{
        earningsData,
        earningsLoading: earningsLoading || storeLoading,
        earningsMutate,
      }}
    >
      {children}
    </EarningsContext.Provider>
  );
}
