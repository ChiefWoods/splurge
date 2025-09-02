import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { SPLURGE_PROGRAM_ID } from './constants';

export function getConfigPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getTreasuryPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getShopperPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('shopper'), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getStorePda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('store'), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getItemPda(storePda: PublicKey, name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('item'), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getOrderPda(
  shopperPda: PublicKey,
  itemPda: PublicKey,
  timestamp: BN
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      shopperPda.toBuffer(),
      itemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    SPLURGE_PROGRAM_ID
  )[0];
}

export function getReviewPda(orderPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('review'), orderPda.toBuffer()],
    SPLURGE_PROGRAM_ID
  )[0];
}
