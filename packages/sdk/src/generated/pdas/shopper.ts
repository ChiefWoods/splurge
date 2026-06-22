import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface ShopperPdaSeeds {
  authority: PublicKey;
}

export function findShopperPda(
  seeds: ShopperPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [Buffer.from("shopper", "utf8"), seeds.authority.toBuffer()];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
