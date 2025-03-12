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
import { getConfigPda } from '@/lib/pda';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from 'bn.js';
import { SPLURGE_WALLET } from '@/lib/constants';
import { OrderStatus } from '@/types/idlAccounts';

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

  async function getCreateShopperIx(
    name: string,
    image: string,
    address: string,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .createShopper(name, image, address)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getCreateStoreIx(
    name: string,
    image: string,
    about: string,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .createStore(name, image, about)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getUpdateStoreIx(
    name: string,
    image: string,
    about: string,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .updateStore(name, image, about)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getCreateItemIx(
    name: string,
    image: string,
    description: string,
    inventoryCount: number,
    price: number,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .createItem(name, image, description, new BN(inventoryCount), price)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getUpdateItemIx(
    name: string,
    inventoryCount: number,
    price: number,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .updateItem(name, new BN(inventoryCount), price)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getDeleteItemIx(
    name: string,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .deleteItem(name)
      .accounts({
        authority,
      })
      .instruction();
  }

  async function getCreateOrderIx(
    timestamp: number,
    amount: number,
    totalUsd: number,
    storePda: PublicKey,
    storeItemPda: PublicKey,
    paymentMint: PublicKey,
    tokenProgram: PublicKey,
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .createOrder(new BN(timestamp), new BN(amount), totalUsd)
      .accounts({
        authority,
        admin: SPLURGE_WALLET.publicKey,
        store: storePda,
        storeItem: storeItemPda,
        paymentMint,
        tokenProgram,
      })
      .instruction();
  }

  async function getUpdateOrderIx(
    status: keyof OrderStatus,
    orderPda: PublicKey
  ): Promise<TransactionInstruction> {
    const orderStatus = { [status]: {} } as unknown as OrderStatus;
    return await program.methods
      .updateOrder(orderStatus)
      .accounts({
        admin: SPLURGE_WALLET.publicKey,
        order: orderPda,
      })
      .instruction();
  }

  async function getCompleteOrderIx(
    timestamp: number,
    shopperPda: PublicKey,
    storePda: PublicKey,
    storeItemPda: PublicKey,
    paymentMint: PublicKey,
    tokenProgram: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .completeOrder(new BN(timestamp))
      .accounts({
        admin: SPLURGE_WALLET.publicKey,
        shopper: shopperPda,
        store: storePda,
        storeItem: storeItemPda,
        paymentMint,
        tokenProgram,
      })
      .instruction();
  }

  async function getCreateReviewIx(
    text: string,
    rating: number,
    authority: PublicKey,
    storeItemPda: PublicKey,
    orderPda: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .createReview(text, rating)
      .accounts({
        authority,
        storeItem: storeItemPda,
        order: orderPda,
      })
      .instruction();
  }

  async function getWithdrawEarningsIx(
    authority: PublicKey,
    paymentMint: PublicKey,
    tokenProgram: PublicKey
  ): Promise<TransactionInstruction> {
    return await program.methods
      .withdrawEarnings()
      .accounts({
        authority,
        paymentMint,
        tokenProgram,
      })
      .instruction();
  }

  const getSplurgeConfigAcc = useCallback(async () => {
    return await program.account.splurgeConfig.fetchNullable(getConfigPda());
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
    getCreateShopperIx,
    getCreateStoreIx,
    getUpdateStoreIx,
    getCreateItemIx,
    getUpdateItemIx,
    getDeleteItemIx,
    getCreateOrderIx,
    getUpdateOrderIx,
    getCompleteOrderIx,
    getCreateReviewIx,
    getWithdrawEarningsIx,
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
