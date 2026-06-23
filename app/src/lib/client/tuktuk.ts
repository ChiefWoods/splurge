import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import tuktukIdl from "@/idl/tuktuk.json";

export { PROGRAM_ID as TUKTUK_PROGRAM_ID } from "@helium/tuktuk-sdk";

export const TASK_QUEUE = new PublicKey(process.env.NEXT_PUBLIC_SPLURGE_TASK_QUEUE as string);

const tuktukAccounts = new BorshAccountsCoder(tuktukIdl as any);

export async function fetchTaskQueue(connection: Connection, address = TASK_QUEUE) {
  const account = await connection.getAccountInfo(address);
  if (!account) throw new Error(`Task queue not found: ${address.toBase58()}`);
  return tuktukAccounts.decode("taskQueueV0", account.data);
}
