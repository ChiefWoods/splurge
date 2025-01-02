'use client';

import { Splurge } from '@/types/splurge';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { useCallback, useMemo, useState } from 'react';
import idl from '../idl/splurge.json';
import { getSplurgeConfigPda } from '@/lib/pda';

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Splurge>>(
    new Program(
      idl as Splurge,
      new AnchorProvider(connection, wallet as AnchorWallet, {
        commitment: 'confirmed',
      })
    )
  );

  useMemo(() => {
    setProgram(
      new Program(
        idl as Splurge,
        new AnchorProvider(connection, wallet as AnchorWallet, {
          commitment: 'confirmed',
        })
      )
    );
  }, [connection, wallet]);

  const getSplurgeConfigAcc = useCallback(async () => {
    return await program.account.splurgeConfig.fetchNullable(
      getSplurgeConfigPda()
    );
  }, [program]);

  const getAllShopperAcc = useCallback(async () => {
    return await program.account.shopper.all();
  }, [program]);

  const getMultipleShopperAcc = useCallback(
    async (shopperPdas: PublicKey[]) => {
      return await program.account.shopper.fetchMultiple(shopperPdas);
    },
    [program]
  );

  const getShopperAcc = useCallback(
    async (shopperPda: PublicKey) => {
      return await program.account.shopper.fetchNullable(shopperPda);
    },
    [program]
  );

  const getAllStoreAcc = useCallback(async () => {
    return await program.account.store.all();
  }, [program]);

  const getMultipleStoreAcc = useCallback(
    async (storePdas: PublicKey[]) => {
      return await program.account.store.fetchMultiple(storePdas);
    },
    [program]
  );

  const getStoreAcc = useCallback(
    async (storePda: PublicKey) => {
      return await program.account.store.fetchNullable(storePda);
    },
    [program]
  );

  const getAllStoreItemAcc = useCallback(async () => {
    return await program.account.storeItem.all();
  }, [program]);

  const getMultipleStoreItemAcc = useCallback(
    async (storeItemPdas: PublicKey[]) => {
      return await program.account.storeItem.fetchMultiple(storeItemPdas);
    },
    [program]
  );

  const getStoreItemAcc = useCallback(
    async (storeItemPda: PublicKey) => {
      return await program.account.storeItem.fetchNullable(storeItemPda);
    },
    [program]
  );

  const getAllOrderAcc = useCallback(async () => {
    return await program.account.order.all();
  }, [program]);

  const getMultipleOrderAcc = useCallback(
    async (orderPdas: PublicKey[]) => {
      return await program.account.order.fetchMultiple(orderPdas);
    },
    [program]
  );

  const getOrderAcc = useCallback(
    async (orderPda: PublicKey) => {
      return await program.account.order.fetchNullable(orderPda);
    },
    [program]
  );

  const getAllReviewAcc = useCallback(async () => {
    return await program.account.review.all();
  }, [program]);

  const getMultipleReviewAcc = useCallback(
    async (reviewPdas: PublicKey[]) => {
      return await program.account.review.fetchMultiple(reviewPdas);
    },
    [program]
  );

  const getReviewAcc = useCallback(
    async (reviewPda: PublicKey) => {
      return await program.account.review.fetchNullable(reviewPda);
    },
    [program]
  );

  return {
    getSplurgeConfigAcc,
    getAllShopperAcc,
    getMultipleShopperAcc,
    getShopperAcc,
    getAllStoreAcc,
    getMultipleStoreAcc,
    getStoreAcc,
    getAllStoreItemAcc,
    getMultipleStoreItemAcc,
    getStoreItemAcc,
    getAllOrderAcc,
    getMultipleOrderAcc,
    getOrderAcc,
    getAllReviewAcc,
    getMultipleReviewAcc,
    getReviewAcc,
  };
}
