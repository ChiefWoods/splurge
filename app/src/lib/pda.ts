import { PublicKey } from '@solana/web3.js';
import {
  ORDER_SEED,
  REVIEW_SEED,
  SHOPPER_SEED,
  SPLURGE_CONFIG_SEED,
  SPLURGE_PROGRAM_ID,
  STORE_ITEM_SEED,
  STORE_SEED,
} from './constants';
import BN from 'bn.js';

export function getSplurgeConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SPLURGE_CONFIG_SEED)],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getShopperPda(authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SHOPPER_SEED), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getStorePda(authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STORE_SEED), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getStoreItemPda(storePda: PublicKey, name: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STORE_ITEM_SEED), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getOrderPda(
  shopperPda: PublicKey,
  storeItemPda: PublicKey,
  timestamp: BN
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(ORDER_SEED),
      shopperPda.toBuffer(),
      storeItemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getReviewPdaAndBump(orderPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVIEW_SEED), orderPda.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}
