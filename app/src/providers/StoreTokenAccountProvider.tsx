'use client';

import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { useConfig } from './ConfigProvider';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { CONNECTION } from '@/lib/client/solana';
import { usePersonalStore } from './PersonalStoreProvider';

interface StoreTokenAccount {
  mint: string;
  ata: string;
  amount: number;
}

interface StoreTokenAccountContextType {
  storeTokenAccountsData: StoreTokenAccount[] | undefined;
  storeTokenAccountsLoading: boolean;
  storeTokenAccountsMutate: KeyedMutator<StoreTokenAccount[]>;
}

const StoreTokenAccountContext = createContext<StoreTokenAccountContextType>(
  {} as StoreTokenAccountContextType
);

export function useStoreTokenAccount() {
  return useContext(StoreTokenAccountContext);
}

export function StoreTokenAccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { publicKey } = useUnifiedWallet();
  const { configData } = useConfig();
  const { personalStoreData } = usePersonalStore();

  const {
    data: storeTokenAccountsData,
    isLoading: storeTokenAccountsLoading,
    mutate: storeTokenAccountsMutate,
  } = useSWR(
    publicKey && configData && personalStoreData
      ? {
          acceptedMints: configData.acceptedMints,
          storePda: personalStoreData.publicKey,
        }
      : null,
    async ({ acceptedMints, storePda }) => {
      return await Promise.all(
        acceptedMints.map(async ({ mint }) => {
          const mintPubkey = new PublicKey(mint);
          const mintAcc = await CONNECTION.getAccountInfo(mintPubkey);

          if (!mintAcc) {
            throw new Error('Mint account not found.');
          }

          const ata = getAssociatedTokenAddressSync(
            mintPubkey,
            new PublicKey(storePda),
            true,
            mintAcc.owner
          );

          let amount: number;

          try {
            const ataAcc = await getAccount(
              CONNECTION,
              ata,
              CONNECTION.commitment,
              mintAcc.owner
            );

            amount = Number(ataAcc.amount);
          } catch (err) {
            amount = 0;
          }

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
    <StoreTokenAccountContext.Provider
      value={{
        storeTokenAccountsData,
        storeTokenAccountsLoading,
        storeTokenAccountsMutate,
      }}
    >
      {children}
    </StoreTokenAccountContext.Provider>
  );
}
