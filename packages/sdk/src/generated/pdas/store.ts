import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface StorePdaSeeds {
  authority: PublicKey;
}

export function findStorePda(
  seeds: StorePdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [Buffer.from("store", "utf8"), seeds.authority.toBuffer()];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
