import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findAdminTokenAccountPda } from "../pdas/adminTokenAccount";
import { findConfigPda } from "../pdas/config";
import { findTreasuryPda } from "../pdas/treasury";
import { findTreasuryTokenAccountPda } from "../pdas/treasuryTokenAccount";

export interface WithdrawTreasuryInstructionAccounts {
  admin: PublicKey;
  treasury?: PublicKey;
  config?: PublicKey;
  paymentMint: PublicKey;
  treasuryTokenAccount?: PublicKey;
  adminTokenAccount?: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
}

export function createWithdrawTreasuryInstruction(
  accounts: WithdrawTreasuryInstructionAccounts,
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
        treasury: accounts.treasury,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    treasuryTokenAccount = derived;
  }
  let adminTokenAccount = accounts.adminTokenAccount;
  if (!adminTokenAccount) {
    const [derived] = findAdminTokenAccountPda(
      {
        admin: accounts.admin,
        tokenProgram: accounts.tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    adminTokenAccount = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: treasury, isSigner: false, isWritable: false },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
    { pubkey: adminTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ];
  const data = Buffer.from("283f7a9e90d85360", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
