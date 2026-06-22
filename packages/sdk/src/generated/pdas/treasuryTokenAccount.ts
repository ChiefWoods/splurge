import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface TreasuryTokenAccountPdaSeeds {
  treasury: PublicKey;
  tokenProgram: PublicKey;
  paymentMint: PublicKey;
}

export function findTreasuryTokenAccountPda(
  seeds: TreasuryTokenAccountPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    seeds.treasury.toBuffer(),
    seeds.tokenProgram.toBuffer(),
    seeds.paymentMint.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
