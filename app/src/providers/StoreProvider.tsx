'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';
import useSWR, { SWRResponse } from 'swr';
import { useWallet } from '@solana/wallet-adapter-react';
import { getStorePda } from '@/lib/pda';
import { useConfig } from './ConfigProvider';
import { CONNECTION } from '@/lib/constants';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';

interface StoreTokenAccount {
  mint: string;
  ata: string;
  amount: number;
}

interface StoreContextType {
  allStores: SWRMutationResponse<ParsedStore[], any, string, never>;
  store: SWRMutationResponse<
    ParsedStore,
    any,
    string,
    {
      publicKey: string;
    }
  >;
  personalStore: SWRResponse<ParsedStore, any, any>;
  storeTokenAccounts: SWRResponse<StoreTokenAccount[], any, any>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const { config } = useConfig();

  const allStores = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).stores as ParsedStore[];
  });

  const store = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .store as ParsedStore;
    }
  );

  const personalStore = useSWR(
    publicKey ? { url: apiEndpoint, publicKey } : null,
    async ({ url, publicKey }) => {
      return (
        await wrappedFetch(`${url}?pda=${getStorePda(publicKey).toBase58()}`)
      ).store as ParsedStore;
    }
  );

  const storeTokenAccounts = useSWR(
    personalStore.data && config.data
      ? {
          acceptedMints: config.data.acceptedMints,
          storePda: personalStore.data.publicKey,
        }
      : null,
    async ({ acceptedMints, storePda }) => {
      return Promise.all(
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
    <StoreContext.Provider
      value={{
        allStores,
        store,
        personalStore,
        storeTokenAccounts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
