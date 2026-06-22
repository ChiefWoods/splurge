import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface OrderPdaSeeds {
  shopper: PublicKey;
  item: PublicKey;
  timestamp: bigint;
}

export function findOrderPda(
  seeds: OrderPdaSeeds,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    Buffer.from("order", "utf8"),
    seeds.shopper.toBuffer(),
    seeds.item.toBuffer(),
    Buffer.from([seeds.timestamp]),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
