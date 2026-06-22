import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface OrderTokenAccountPdaSeeds {
  order: PublicKey;
  tokenProgram: PublicKey;
  paymentMint: PublicKey;
}

export function findOrderTokenAccountPda(
  seeds: OrderTokenAccountPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    seeds.order.toBuffer(),
    seeds.tokenProgram.toBuffer(),
    seeds.paymentMint.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
