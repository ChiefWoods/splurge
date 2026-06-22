import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface ItemPdaSeeds {
  store: PublicKey;
  name: string;
}

export function findItemPda(
  seeds: ItemPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    Buffer.from("item", "utf8"),
    seeds.store.toBuffer(),
    Buffer.from(seeds.name, "utf8"),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
