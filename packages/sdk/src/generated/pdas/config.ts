import { PublicKey } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export function findConfigPda(programId: PublicKey = SPLURGE_PROGRAM_ID): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [Buffer.from("config", "utf8")];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
