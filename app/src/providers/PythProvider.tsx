'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';
import { Wallet } from '@coral-xyz/anchor';
import { getPriorityFee } from '@/lib/client/solana';
import { VersionedTransaction, Signer } from '@solana/web3.js';
import { useAnchorWallet } from '@jup-ag/wallet-adapter';
import { HERMES_CLIENT } from '@/lib/client/pyth';

interface PythContextType {
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
      throw new Error('Pyth Solana Receiver not initialized.');
    }

    const data = await getPriceUpdateData(id);

    const txBuilder = pythSolanaReceiver.newTransactionBuilder({
      closeUpdateAccounts: true,
    });
    await txBuilder.addUpdatePriceFeed(data, 0);

    return await txBuilder.buildVersionedTransactions({
      computeUnitPriceMicroLamports: await getPriorityFee(connection),
      tightComputeBudget: true,
    });
  }

  return (
    <PythContext.Provider
      value={{
        pythSolanaReceiver,
        getUpdatePriceFeedTx,
      }}
    >
      {children}
    </PythContext.Provider>
  );
}
