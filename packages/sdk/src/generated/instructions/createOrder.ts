import { getI64Codec, getStructCodec, getU32Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findAuthorityTokenAccountPda } from "../pdas/authorityTokenAccount";
import { findConfigPda } from "../pdas/config";
import { findOrderPda } from "../pdas/order";
import { findOrderTokenAccountPda } from "../pdas/orderTokenAccount";
import { findShopperPda } from "../pdas/shopper";
import { findTreasuryPda } from "../pdas/treasury";
import { findTreasuryTokenAccountPda } from "../pdas/treasuryTokenAccount";

export interface CreateOrderInstructionAccounts {
  authority: PublicKey;
  treasury?: PublicKey;
  config?: PublicKey;
  shopper?: PublicKey;
  store: PublicKey;
  item: PublicKey;
  order?: PublicKey;
  priceUpdateV2: PublicKey;
  paymentMint: PublicKey;
  authorityTokenAccount?: PublicKey;
  treasuryTokenAccount?: PublicKey;
  orderTokenAccount?: PublicKey;
  systemProgram?: PublicKey;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}

export interface CreateOrderInstructionArgs {
  amount: number;
  timestamp: bigint;
}

const CreateOrderInstructionDataCodec = getStructCodec([
  ["amount", getU32Codec()],
  ["timestamp", getI64Codec()],
]);

export function createCreateOrderInstruction(
  accounts: CreateOrderInstructionAccounts,
  args: CreateOrderInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  const tokenProgram =
    accounts.tokenProgram ?? new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  const associatedTokenProgram =
    accounts.associatedTokenProgram ??
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
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
  let shopper = accounts.shopper;
  if (!shopper) {
    const [derived] = findShopperPda(
      {
        authority: accounts.authority,
      },
      programId,
    );
    shopper = derived;
  }
  let order = accounts.order;
  if (!order) {
    const [derived] = findOrderPda(
      {
        shopper,
        item: accounts.item,
        timestamp: args.timestamp,
      },
      programId,
    );
    order = derived;
  }
  let authorityTokenAccount = accounts.authorityTokenAccount;
  if (!authorityTokenAccount) {
    const [derived] = findAuthorityTokenAccountPda(
      {
        authority: accounts.authority,
        tokenProgram: tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    authorityTokenAccount = derived;
  }
  let treasuryTokenAccount = accounts.treasuryTokenAccount;
  if (!treasuryTokenAccount) {
    const [derived] = findTreasuryTokenAccountPda(
      {
        treasury,
        tokenProgram: tokenProgram,
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
        order,
        tokenProgram: tokenProgram,
        paymentMint: accounts.paymentMint,
      },
      programId,
    );
    orderTokenAccount = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: treasury, isSigner: false, isWritable: false },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: shopper, isSigner: false, isWritable: false },
    { pubkey: accounts.store, isSigner: false, isWritable: false },
    { pubkey: accounts.item, isSigner: false, isWritable: true },
    { pubkey: order, isSigner: false, isWritable: true },
    { pubkey: accounts.priceUpdateV2, isSigner: false, isWritable: false },
    { pubkey: accounts.paymentMint, isSigner: false, isWritable: false },
    { pubkey: authorityTokenAccount, isSigner: false, isWritable: true },
    { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
    { pubkey: orderTokenAccount, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ];
  const instructionData = Buffer.from(CreateOrderInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("8d3625cfedd2fad7", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
