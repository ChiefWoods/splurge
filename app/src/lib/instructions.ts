import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SPLURGE_PROGRAM, TASK_QUEUE, TUKTUK_PROGRAM } from './constants';
import {
  CreateReviewArgs,
  InitializeShopperArgs,
  InitializeStoreArgs,
  ListItemArgs,
  UpdateItemArgs,
} from '../types/accounts';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
} from '@helium/tuktuk-sdk';
import { fetchTaskQueueAcc } from './accounts';

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
  priceUpdateV2,
  paymentMint,
  tokenProgram,
}: {
  amount: number;
  authority: PublicKey;
  storePda: PublicKey;
  itemPda: PublicKey;
  priceUpdateV2: PublicKey;
  paymentMint: PublicKey;
  tokenProgram: PublicKey;
}): Promise<TransactionInstruction> {
  // timestamp is deducted by 1 second to provide an approximation buffer for clock drift
  const timestamp = Math.floor(Date.now() / 1000 - 1);

  return await SPLURGE_PROGRAM.methods
    .createOrder(amount, new BN(timestamp))
    .accountsPartial({
      authority,
      store: storePda,
      item: itemPda,
      priceUpdateV2,
      paymentMint,
      tokenProgram,
    })
    .instruction();
}

export async function shipOrderIx({
  admin,
  orderPda,
  authority,
  itemPda,
  paymentMint,
  shopperPda,
  storePda,
  tokenProgram,
}: {
  admin: PublicKey;
  orderPda: PublicKey;
  authority: PublicKey;
  itemPda: PublicKey;
  paymentMint: PublicKey;
  shopperPda: PublicKey;
  storePda: PublicKey;
  tokenProgram: PublicKey;
}): Promise<TransactionInstruction> {
  const orderAta = getAssociatedTokenAddressSync(
    paymentMint,
    orderPda,
    true,
    tokenProgram
  );
  const storeAta = getAssociatedTokenAddressSync(
    paymentMint,
    storePda,
    true,
    tokenProgram
  );
  const taskQueueAcc = await fetchTaskQueueAcc(TASK_QUEUE);
  if (!taskQueueAcc) throw new Error('Task queue not found.');
  const taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];
  const [taskPda] = taskKey(TASK_QUEUE, taskId, TUKTUK_PROGRAM.programId);
  const [taskQueueAuthorityPda] = taskQueueAuthorityKey(TASK_QUEUE, admin);

  return await SPLURGE_PROGRAM.methods
    .shipOrder(taskId)
    .accountsPartial({
      admin,
      order: orderPda,
      authority,
      item: itemPda,
      orderTokenAccount: orderAta,
      paymentMint,
      shopper: shopperPda,
      store: storePda,
      storeTokenAccount: storeAta,
      task: taskPda,
      taskQueue: TASK_QUEUE,
      tokenProgram,
      tuktuk: TUKTUK_PROGRAM.programId,
      taskQueueAuthority: taskQueueAuthorityPda,
    })
    .instruction();
}

export async function cancelOrderIx({
  admin,
  orderPda,
  paymentMint,
  shopperPda,
  tokenProgram,
}: {
  admin: PublicKey;
  orderPda: PublicKey;
  paymentMint: PublicKey;
  shopperPda: PublicKey;
  tokenProgram: PublicKey;
}) {
  return SPLURGE_PROGRAM.methods
    .cancelOrder()
    .accountsPartial({
      admin,
      order: orderPda,
      paymentMint,
      shopper: shopperPda,
      tokenProgram,
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
