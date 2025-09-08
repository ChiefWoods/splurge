'use client';

import { ACCEPTED_MINTS_METADATA, HERMES_CLIENT } from '@/lib/constants';
import { useConnection } from '@solana/wallet-adapter-react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';
import { Wallet } from '@coral-xyz/anchor';
import { getPriorityFee } from '@/lib/solana-helpers';
import { VersionedTransaction, Signer } from '@solana/web3.js';
import { useAnchorWallet } from '@jup-ag/wallet-adapter';

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
  pythSolanaReceiver: PythSolanaReceiver | null;
  getUpdatePriceFeedTx: (
    id: string
  ) => Promise<VersionedTransactionWithEphemeralSigners[]>;
}

export interface VersionedTransactionWithEphemeralSigners {
  tx: VersionedTransaction;
  signers: Signer[];
}

const PythContext = createContext<PythContextType>({} as PythContextType);

export function usePyth() {
  return useContext(PythContext);
}

export function PythProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [pythSolanaReceiver, setPythSolanaReceiver] =
    useState<PythSolanaReceiver | null>(null);

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      setPythSolanaReceiver(
        new PythSolanaReceiver({
          connection,
          wallet: wallet as Wallet,
        })
      );
    })();
  }, [connection, wallet]);

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

  async function getPriceUpdateData(id: string): Promise<string[]> {
    const { data } = (
      await HERMES_CLIENT.getLatestPriceUpdates([id], { encoding: 'base64' })
    ).binary;

    if (data.length === 0) {
      throw new Error('No price update data returned.');
    }

    return data;
  }

  async function getUpdatePriceFeedTx(
    id: string
  ): Promise<VersionedTransactionWithEphemeralSigners[]> {
    if (!pythSolanaReceiver) {
      throw new Error('Pyth Solana Receiver not initialized');
    }

    const data = await getPriceUpdateData(id);

    const txBuilder = pythSolanaReceiver.newTransactionBuilder({
      closeUpdateAccounts: true,
    });
    await txBuilder.addUpdatePriceFeed(data, 0);

    return await txBuilder.buildVersionedTransactions({
      computeUnitPriceMicroLamports: await getPriorityFee(),
      tightComputeBudget: true,
    });
  }

  return (
    <PythContext.Provider
      value={{
        pricesData,
        pricesIsLoading,
        pricesMutate,
        pythSolanaReceiver,
        getUpdatePriceFeedTx,
      }}
    >
      {children}
    </PythContext.Provider>
  );
}
