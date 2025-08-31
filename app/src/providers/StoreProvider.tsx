'use client';

import { ParsedStore } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, {
  TriggerWithArgs,
  TriggerWithoutArgs,
} from 'swr/mutation';
import useSWR, { KeyedMutator } from 'swr';
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
  allStoresData: ParsedStore[] | undefined;
  allStoresIsMutating: boolean;
  allStoresTrigger: TriggerWithoutArgs<ParsedStore[], any, string, never>;
  storeData: ParsedStore | undefined;
  storeIsMutating: boolean;
  storeTrigger: TriggerWithArgs<
    ParsedStore,
    any,
    string,
    {
      publicKey: string;
    }
  >;
  personalStoreData: ParsedStore | undefined;
  personalStoreIsLoading: boolean;
  personalStoreMutate: KeyedMutator<ParsedStore>;
  storeTokenAccountsData: StoreTokenAccount[] | undefined;
  storeTokenAccountsIsLoading: boolean;
  storeTokenAccountsMutate: KeyedMutator<
    {
      mint: string;
      ata: string;
      amount: number;
    }[]
  >;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`;

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const { configData } = useConfig();

  const {
    data: allStoresData,
    isMutating: allStoresIsMutating,
    trigger: allStoresTrigger,
  } = useSWRMutation(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).stores as ParsedStore[];
  });

  const {
    data: storeData,
    isMutating: storeIsMutating,
    trigger: storeTrigger,
  } = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .store as ParsedStore;
    }
  );

  const {
    data: personalStoreData,
    isLoading: personalStoreIsLoading,
    mutate: personalStoreMutate,
  } = useSWR(
    publicKey ? { url: apiEndpoint, publicKey } : null,
    async ({ url, publicKey }) => {
      return (
        await wrappedFetch(`${url}?pda=${getStorePda(publicKey).toBase58()}`)
      ).store as ParsedStore;
    }
  );

  const {
    data: storeTokenAccountsData,
    isLoading: storeTokenAccountsIsLoading,
    mutate: storeTokenAccountsMutate,
  } = useSWR(
    publicKey && personalStoreData && configData
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
    <StoreContext.Provider
      value={{
        allStoresData,
        allStoresIsMutating,
        allStoresTrigger,
        storeData,
        storeIsMutating,
        storeTrigger,
        personalStoreData,
        personalStoreIsLoading,
        personalStoreMutate,
        storeTokenAccountsData,
        storeTokenAccountsIsLoading,
        storeTokenAccountsMutate,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
