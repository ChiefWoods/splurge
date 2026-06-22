import { Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import { PublicKey } from "@solana/web3.js";

export async function fetchConfigV0Acc(program: Program<Tuktuk>, configV0Pda: PublicKey) {
  return await program.account.tuktukConfigV0.fetchNullable(configV0Pda);
}

export async function fetchTaskQueueAcc(program: Program<Tuktuk>, taskQueuePda: PublicKey) {
  return await program.account.taskQueueV0.fetchNullable(taskQueuePda);
}
