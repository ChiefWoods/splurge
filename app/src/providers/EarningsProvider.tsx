'use client';

import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  unpackAccount,
} from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { useStore } from './StoreProvider';
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
      const mintAccs = await connection.getMultipleAccountsInfo(
        acceptedMints.map((mint) => new PublicKey(mint.mint))
      );

      const atas = mintAccs.map((mintAcc, i) => {
        const mint = acceptedMints[i].mint;

        if (!mintAcc) {
          throw new Error(`Mint account not found: ${mint}`);
        }

        const ata = getAssociatedTokenAddressSync(
          new PublicKey(mint),
          new PublicKey(storePda),
          !PublicKey.isOnCurve(storePda),
          mintAcc.owner
        );

        return {
          mint,
          ata,
          programId: mintAcc.owner,
        };
      });

      const ataInfos = await connection.getMultipleAccountsInfo(
        atas.map(({ ata }) => ata)
      );

      return atas.map(({ ata, mint, programId }, i) => ({
        mint,
        ata: ata.toBase58(),
        amount:
          ataInfos[i] === null
            ? 0
            : Number(unpackAccount(ata, ataInfos[i], programId).amount),
      }));
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
