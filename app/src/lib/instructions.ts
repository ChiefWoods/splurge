import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SPLURGE_PROGRAM } from './constants';
import {
  CreateReviewArgs,
  InitializeShopperArgs,
  InitializeStoreArgs,
  ListItemArgs,
  OrderStatus,
  UpdateItemArgs,
} from '../types/accounts';

export async function createShopperIx({
  name,
  image,
  address,
  authority,
}: InitializeShopperArgs & {
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .initializeShopper({
      name,
      image,
      address,
    })
    .accounts({
      authority,
    })
    .instruction();
}

export async function createStoreIx({
  name,
  image,
  about,
  authority,
}: InitializeStoreArgs & {
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .initializeStore({
      name,
      image,
      about,
    })
    .accounts({
      authority,
    })
    .instruction();
}

export async function listItemIx({
  price,
  inventoryCount,
  name,
  image,
  description,
  authority,
}: ListItemArgs & {
  authority: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .listItem({
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

export async function updateItemIx({
  price,
  inventoryCount,
  authority,
  itemPda,
  storePda,
}: UpdateItemArgs & {
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

export async function unlistItemIx({
  authority,
  itemPda,
  storePda,
}: {
  authority: PublicKey;
  itemPda: PublicKey;
  storePda: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .unlistItem()
    .accountsPartial({
      authority,
      item: itemPda,
      store: storePda,
    })
    .instruction();
}

export async function createOrderIx({
  amount,
  authority,
  storePda,
  itemPda,
  paymentMint,
  tokenProgram,
}: {
  amount: number;
  authority: PublicKey;
  storePda: PublicKey;
  itemPda: PublicKey;
  paymentMint: PublicKey;
  tokenProgram: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .createOrder({
      amount,
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

export async function updateOrderIx({
  status,
  admin,
  orderPda,
}: {
  status: OrderStatus;
  admin: PublicKey;
  orderPda: PublicKey;
}): Promise<TransactionInstruction> {
  return await SPLURGE_PROGRAM.methods
    .updateOrder(status)
    .accounts({
      admin,
      order: orderPda,
    })
    .instruction();
}

export async function createReviewIx({
  text,
  rating,
  authority,
  shopperPda,
  orderPda,
}: CreateReviewArgs & {
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

export async function withdrawEarningsIx({
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
