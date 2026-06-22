import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface StoreTokenAccountPdaSeeds {
  store: PublicKey;
  tokenProgram: PublicKey;
  paymentMint: PublicKey;
}

export function findStoreTokenAccountPda(
  seeds: StoreTokenAccountPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    seeds.store.toBuffer(),
    seeds.tokenProgram.toBuffer(),
    seeds.paymentMint.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
