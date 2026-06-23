import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface AuthorityTokenAccountPdaSeeds {
  authority: PublicKey;
  tokenProgram?: PublicKey;
  paymentMint: PublicKey;
}

export function findAuthorityTokenAccountPda(
  seeds: AuthorityTokenAccountPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    seeds.authority.toBuffer(),
    seeds.tokenProgram.toBuffer(),
    seeds.paymentMint.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
