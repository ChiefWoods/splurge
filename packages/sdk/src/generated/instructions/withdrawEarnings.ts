import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findAuthorityTokenAccountPda } from "../pdas/authorityTokenAccount";
import { findConfigPda } from "../pdas/config";
import { findStorePda } from "../pdas/store";
import { findStoreTokenAccountPda } from "../pdas/storeTokenAccount";

export interface WithdrawEarningsInstructionAccounts {
  authority: PublicKey;
  config?: PublicKey;
  store?: PublicKey;
  paymentMint: PublicKey;
  storeTokenAccount?: PublicKey;
  authorityTokenAccount?: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
}

export function createWithdrawEarningsInstruction(
  accounts: WithdrawEarningsInstructionAccounts,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  let config = accounts.config;
  if (!config) {
    const [derived] = findConfigPda(programId);
    config = derived;
  }
  let store = accounts.store;
  if (!store) {
    const [derived] = findStorePda(
      {
        authority: accounts.authority,
      },
      programId,
    );
    store = derived;
  }
  let storeTokenAccount = accounts.storeTokenAccount;
  if (!storeTokenAccount) {
    const [derived] = findStoreTokenAccountPda(
      {
        store: accounts.store,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    storeTokenAccount = derived;
  }
  let authorityTokenAccount = accounts.authorityTokenAccount;
  if (!authorityTokenAccount) {
    const [derived] = findAuthorityTokenAccountPda(
      {
        authority: accounts.authority,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    authorityTokenAccount = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: store, isSigner: false, isWritable: false },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: storeTokenAccount, isSigner: false, isWritable: true },
    { pubkey: authorityTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ];
  const data = Buffer.from("0684e9fef157f7b9", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
