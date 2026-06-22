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
  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(seeds.timestamp);
  const seedsBuffer: Buffer[] = [
    Buffer.from("order", "utf8"),
    seeds.shopper.toBuffer(),
    seeds.item.toBuffer(),
    timestampBuffer,
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
