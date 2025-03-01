import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import idl from '../target/idl/splurge.json';

const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);

export function getConfigPdaAndBump(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    SPLURGE_PROGRAM_ID
  );
}

export function getShopperPdaAndBump(
  authority: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('shopper'), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}

export function getStorePdaAndBump(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('store'), authority.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}

export function getItemPdaAndBump(
  storePda: PublicKey,
  name: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('item'), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM_ID
  );
}

export function getOrderPdaAndBump(
  shopperPda: PublicKey,
  itemPda: PublicKey,
  timestamp: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      shopperPda.toBuffer(),
      itemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    SPLURGE_PROGRAM_ID
  );
}

export function getReviewPdaAndBump(orderPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('review'), orderPda.toBuffer()],
    SPLURGE_PROGRAM_ID
  );
}
