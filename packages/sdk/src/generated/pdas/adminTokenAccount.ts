import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface AdminTokenAccountPdaSeeds {
  admin: PublicKey;
  tokenProgram: PublicKey;
  paymentMint: PublicKey;
}

export function findAdminTokenAccountPda(
  seeds: AdminTokenAccountPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    seeds.admin.toBuffer(),
    seeds.tokenProgram.toBuffer(),
    seeds.paymentMint.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
