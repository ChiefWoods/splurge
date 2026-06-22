import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface UnlistItemInstructionAccounts {
  authority: PublicKey;
  item: PublicKey;
  store: PublicKey;
  systemProgram: PublicKey;
}

export function createUnlistItemInstruction(
  accounts: UnlistItemInstructionAccounts,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.item, isSigner: false, isWritable: true },
    { pubkey: accounts.store, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];
  const data = Buffer.from("aa2dc377a29b2a5e", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
