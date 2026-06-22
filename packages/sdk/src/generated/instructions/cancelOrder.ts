import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findAuthorityTokenAccountPda } from "../pdas/authorityTokenAccount";
import { findConfigPda } from "../pdas/config";
import { findOrderTokenAccountPda } from "../pdas/orderTokenAccount";
import { findTreasuryPda } from "../pdas/treasury";
import { findTreasuryTokenAccountPda } from "../pdas/treasuryTokenAccount";

export interface CancelOrderInstructionAccounts {
  admin: PublicKey;
  treasury?: PublicKey;
  authority: PublicKey;
  config?: PublicKey;
  shopper: PublicKey;
  order: PublicKey;
  paymentMint: PublicKey;
  treasuryTokenAccount?: PublicKey;
  orderTokenAccount?: PublicKey;
  authorityTokenAccount?: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
}

export function createCancelOrderInstruction(
  accounts: CancelOrderInstructionAccounts,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  let treasury = accounts.treasury;
  if (!treasury) {
    const [derived] = findTreasuryPda(programId);
    treasury = derived;
  }
  let config = accounts.config;
  if (!config) {
    const [derived] = findConfigPda(programId);
    config = derived;
  }
  let treasuryTokenAccount = accounts.treasuryTokenAccount;
  if (!treasuryTokenAccount) {
    const [derived] = findTreasuryTokenAccountPda(
      {
        treasury: treasury,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    treasuryTokenAccount = derived;
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
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: treasury, isSigner: false, isWritable: false },
    { pubkey: accounts.authority, isSigner: false, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: accounts.shopper, isSigner: false, isWritable: false },
    { pubkey: accounts.order, isSigner: false, isWritable: true },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
    { pubkey: orderTokenAccount, isSigner: false, isWritable: true },
    { pubkey: authorityTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ];
  const data = Buffer.from("5f81edf00831df84", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
