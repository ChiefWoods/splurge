import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface ReviewPdaSeeds {
  order: PublicKey;
}

export function findReviewPda(
  seeds: ReviewPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [Buffer.from("review", "utf8"), seeds.order.toBuffer()];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
