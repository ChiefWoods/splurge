import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  ORDER_SEED,
  REVIEW_SEED,
  SHOPPER_SEED,
  SPLURGE_CONFIG_SEED,
  SPLURGE_PROGRAM_ID,
  STORE_ITEM_SEED,
  STORE_SEED,
} from './constants';

export function getSplurgeConfigPdaAndBump(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SPLURGE_CONFIG_SEED)],
    SPLURGE_PROGRAM_ID
  );
}

export function getShopperPdaAndBump(
  authority: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SHOPPER_SEED), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}

export function getStorePdaAndBump(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STORE_SEED), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}

export function getStoreItemPdaAndBump(
  storePda: PublicKey,
  name: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STORE_ITEM_SEED), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM_ID
  );
}

export function getOrderPdaAndBump(
  shopperPda: PublicKey,
  storeItemPda: PublicKey,
  timestamp: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(ORDER_SEED),
      shopperPda.toBuffer(),
      storeItemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    SPLURGE_PROGRAM_ID
  );
}

export function getReviewPdaAndBump(orderPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVIEW_SEED), orderPda.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}
