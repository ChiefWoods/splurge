import { Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { PublicKey } from '@solana/web3.js';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';

export async function fetchConfigAcc(
  program: Program<Splurge>,
  configPda: PublicKey
) {
  return await program.account.config.fetchNullable(configPda);
}

export async function fetchShopperAcc(
  program: Program<Splurge>,
  shopperPda: PublicKey
) {
  return await program.account.shopper.fetchNullable(shopperPda);
}

export async function fetchStoreAcc(
  program: Program<Splurge>,
  storePda: PublicKey
) {
  return await program.account.store.fetchNullable(storePda);
}

export async function fetchItemAcc(
  program: Program<Splurge>,
  itemPda: PublicKey
) {
  return await program.account.item.fetchNullable(itemPda);
}

export async function fetchOrderAcc(
  program: Program<Splurge>,
  orderPda: PublicKey
) {
  return await program.account.order.fetchNullable(orderPda);
}

export async function fetchReviewAcc(
  program: Program<Splurge>,
  reviewPda: PublicKey
) {
  return await program.account.review.fetchNullable(reviewPda);
}

export async function fetchConfigV0Acc(
  program: Program<Tuktuk>,
  configV0Pda: PublicKey
) {
  return await program.account.tuktukConfigV0.fetchNullable(configV0Pda);
}

export async function fetchTaskQueueAcc(
  program: Program<Tuktuk>,
  taskQueuePda: PublicKey
) {
  return await program.account.taskQueueV0.fetchNullable(taskQueuePda);
}
