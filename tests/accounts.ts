import { Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { PublicKey } from '@solana/web3.js';

export async function getConfigAcc(
  program: Program<Splurge>,
  configPda: PublicKey
) {
  return await program.account.config.fetchNullable(configPda);
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

export async function getItemAcc(
  program: Program<Splurge>,
  itemPda: PublicKey
) {
  return await program.account.item.fetchNullable(itemPda);
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
