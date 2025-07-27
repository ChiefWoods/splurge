import { PublicKey } from '@solana/web3.js';
import { MAX_ITEM_NAME_LENGTH, SPLURGE_PROGRAM } from './constants';
import { BN } from '@coral-xyz/anchor';

export function getConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    SPLURGE_PROGRAM.programId
  )[0];
}

export function getShopperPda(authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('shopper'), authority.toBuffer()],
    SPLURGE_PROGRAM.programId
  )[0];
}

export function getStorePda(authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('store'), authority.toBuffer()],
    SPLURGE_PROGRAM.programId
  )[0];
}

export function getItemPda(storePda: PublicKey, name: string): PublicKey {
  if (name.length > MAX_ITEM_NAME_LENGTH) {
    throw new Error('Store item name exceeds maximum seed length');
  }

  return PublicKey.findProgramAddressSync(
    [Buffer.from('item'), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM.programId
  )[0];
}

export function getOrderPda(
  shopperPda: PublicKey,
  itemPda: PublicKey,
  timestamp: BN
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      shopperPda.toBuffer(),
      itemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    SPLURGE_PROGRAM.programId
  )[0];
}

export function getReviewPda(orderPda: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('review'), orderPda.toBuffer()],
    SPLURGE_PROGRAM.programId
  )[0];
}
