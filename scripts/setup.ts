import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { findTreasuryPda } from "@splurge/sdk";

import { tuktukIdl } from "../common/tuktuk";

export const admin = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR)));
export const connection = new Connection(
  process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet"),
);
const provider = new AnchorProvider(connection, new Wallet(admin));
export const tuktukProgram = new Program<Tuktuk>(tuktukIdl, provider);

export const treasury = findTreasuryPda()[0];

export async function sendTransaction(
  instructions: TransactionInstruction[],
  signers: Signer[] = [admin],
) {
  const transaction = new Transaction().add(...instructions);
  return sendAndConfirmTransaction(connection, transaction, signers);
}
