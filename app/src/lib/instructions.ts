import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SPLURGE_PROGRAM } from './constants';
import { BN } from '@coral-xyz/anchor';
import { OrderStatus } from './accounts';

export async function getCreateShopperIx({
  name,
  image,
  address,
  authority,
}: {
  name: string;
  image: string;
  address: string;
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createShopper({
      name,
      image,
      address,
    })
    .accounts({
      authority,
    })
    .instruction();
}

export async function getCreateStoreIx({
  name,
  image,
  about,
  authority,
}: {
  name: string;
  image: string;
  about: string;
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createStore({
      name,
      image,
      about,
    })
    .accounts({
      authority,
    })
    .instruction();
}

export async function getCreateItemIx({
  price,
  inventoryCount,
  name,
  image,
  description,
  authority,
}: {
  price: number;
  inventoryCount: number;
  name: string;
  image: string;
  description: string;
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createItem({
      price,
      inventoryCount,
      name,
      image,
      description,
    })
    .accounts({
      authority,
    })
    .instruction();
}

export async function getUpdateItemIx({
  price,
  inventoryCount,
  authority,
  itemPda,
  storePda,
}: {
  price: number;
  inventoryCount: number;
  authority: PublicKey;
  itemPda: PublicKey;
  storePda: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .updateItem({
      price,
      inventoryCount,
    })
    .accountsPartial({
      authority,
      item: itemPda,
      store: storePda,
    })
    .instruction();
}

export async function getDeleteItemIx({
  authority,
  itemPda,
  storePda,
}: {
  authority: PublicKey;
  itemPda: PublicKey;
  storePda: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .deleteItem()
    .accountsPartial({
      authority,
      item: itemPda,
      store: storePda,
    })
    .instruction();
}

export async function getCreateOrderIx({
  amount,
  timestamp,
  authority,
  storePda,
  itemPda,
  paymentMint,
  tokenProgram,
}: {
  amount: number;
  timestamp: number;
  authority: PublicKey;
  storePda: PublicKey;
  itemPda: PublicKey;
  paymentMint: PublicKey;
  tokenProgram: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createOrder({
      amount,
      timestamp: new BN(timestamp),
    })
    .accountsPartial({
      authority,
      store: storePda,
      item: itemPda,
      paymentMint,
      tokenProgram,
    })
    .instruction();
}

export async function getUpdateOrderIx({
  status,
  orderPda,
}: {
  status: keyof OrderStatus;
  orderPda: PublicKey;
}): Promise<TransactionInstruction> {
  const orderStatus = { [status]: {} } as unknown as OrderStatus;
  return await SPLURGE_PROGRAM.methods
    .updateOrder(orderStatus)
    .accounts({
      order: orderPda,
    })
    .instruction();
}

export async function getCreateReviewIx({
  text,
  rating,
  authority,
  shopperPda,
  orderPda,
}: {
  text: string;
  rating: number;
  authority: PublicKey;
  shopperPda: PublicKey;
  orderPda: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createReview({
      text,
      rating,
    })
    .accountsPartial({
      authority,
      shopper: shopperPda,
      order: orderPda,
    })
    .instruction();
}

export async function getWithdrawEarningsIx({
  authority,
  storePda,
  paymentMint,
  tokenProgram,
}: {
  authority: PublicKey;
  storePda: PublicKey;
  paymentMint: PublicKey;
  tokenProgram: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .withdrawEarnings()
    .accountsPartial({
      authority,
      store: storePda,
      paymentMint,
      tokenProgram,
    })
    .instruction();
}
