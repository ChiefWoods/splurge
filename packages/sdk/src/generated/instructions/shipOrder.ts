import { getStructCodec, getU16Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findConfigPda } from "../pdas/config";
import { findStoreTokenAccountPda } from "../pdas/storeTokenAccount";

export interface ShipOrderInstructionAccounts {
  admin: PublicKey;
  config?: PublicKey;
  order: PublicKey;
  associatedTokenProgram?: PublicKey;
  authority: PublicKey;
  item: PublicKey;
  orderTokenAccount: PublicKey;
  paymentMint: PublicKey;
  shopper: PublicKey;
  store: PublicKey;
  storeTokenAccount?: PublicKey;
  systemProgram?: PublicKey;
  tokenProgram?: PublicKey;
  tuktuk: PublicKey;
  taskQueue: PublicKey;
  task: PublicKey;
  taskQueueAuthority: PublicKey;
}

export interface ShipOrderInstructionArgs {
  taskId: number;
}

const ShipOrderInstructionDataCodec = getStructCodec([["taskId", getU16Codec()]]);

export function createShipOrderInstruction(
  accounts: ShipOrderInstructionAccounts,
  args: ShipOrderInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  const tokenProgram =
    accounts.tokenProgram ?? new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  const associatedTokenProgram =
    accounts.associatedTokenProgram ??
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
  let config = accounts.config;
  if (!config) {
    const [derived] = findConfigPda(programId);
    config = derived;
  }
  let storeTokenAccount = accounts.storeTokenAccount;
  if (!storeTokenAccount) {
    const [derived] = findStoreTokenAccountPda(
      {
        store: accounts.store,
        tokenProgram: tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    storeTokenAccount = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: accounts.order, isSigner: false, isWritable: true },
    {
      pubkey: associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.authority, isSigner: false, isWritable: true },
    { pubkey: accounts.item, isSigner: false, isWritable: false },
    { pubkey: accounts.orderTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: accounts.shopper, isSigner: false, isWritable: false },
    { pubkey: accounts.store, isSigner: false, isWritable: false },
    { pubkey: storeTokenAccount, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tuktuk, isSigner: false, isWritable: false },
    { pubkey: accounts.taskQueue, isSigner: false, isWritable: true },
    { pubkey: accounts.task, isSigner: false, isWritable: true },
    { pubkey: accounts.taskQueueAuthority, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(ShipOrderInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("02bf972d10f8618e", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
