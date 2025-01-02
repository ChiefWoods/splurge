import { Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { PublicKey } from '@solana/web3.js';

export async function getSplurgeConfigAcc(
  program: Program<Splurge>,
  splurgeConfigPda: PublicKey
) {
  return await program.account.splurgeConfig.fetchNullable(splurgeConfigPda);
}

export async function getShopperAcc(
  program: Program<Splurge>,
  shopperPda: PublicKey
) {
  return await program.account.shopper.fetchNullable(shopperPda);
}

export async function getStoreAcc(
  program: Program<Splurge>,
  storePda: PublicKey
) {
  return await program.account.store.fetchNullable(storePda);
}

export async function getStoreItemAcc(
  program: Program<Splurge>,
  storeItemPda: PublicKey
) {
  return await program.account.storeItem.fetchNullable(storeItemPda);
}

export async function getOrderAcc(
  program: Program<Splurge>,
  orderPda: PublicKey
) {
  return await program.account.order.fetchNullable(orderPda);
}

export async function getReviewAcc(
  program: Program<Splurge>,
  reviewPda: PublicKey
) {
  return await program.account.review.fetchNullable(reviewPda);
}
