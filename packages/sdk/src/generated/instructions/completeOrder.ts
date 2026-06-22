import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findConfigPda } from "../pdas/config";
import { findOrderTokenAccountPda } from "../pdas/orderTokenAccount";
import { findStoreTokenAccountPda } from "../pdas/storeTokenAccount";

export interface CompleteOrderInstructionAccounts {
  admin: PublicKey;
  authority: PublicKey;
  config?: PublicKey;
  shopper: PublicKey;
  store: PublicKey;
  item: PublicKey;
  order: PublicKey;
  paymentMint: PublicKey;
  orderTokenAccount?: PublicKey;
  storeTokenAccount?: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
}

export function createCompleteOrderInstruction(
  accounts: CompleteOrderInstructionAccounts,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  let config = accounts.config;
  if (!config) {
    const [derived] = findConfigPda(programId);
    config = derived;
  }
  let orderTokenAccount = accounts.orderTokenAccount;
  if (!orderTokenAccount) {
    const [derived] = findOrderTokenAccountPda(
      {
        order: accounts.order,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    orderTokenAccount = derived;
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
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.authority, isSigner: false, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: accounts.shopper, isSigner: false, isWritable: false },
    { pubkey: accounts.store, isSigner: false, isWritable: false },
    { pubkey: accounts.item, isSigner: false, isWritable: false },
    { pubkey: accounts.order, isSigner: false, isWritable: true },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: orderTokenAccount, isSigner: false, isWritable: true },
    { pubkey: storeTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ];
  const data = Buffer.from("494e59078c841161", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
