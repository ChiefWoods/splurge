import {
  fixCodecSize,
  getArrayCodec,
  getBytesCodec,
  getStructCodec,
  getU16Codec,
  transformCodec,
} from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findConfigPda } from "../pdas/config";
import { findTreasuryPda } from "../pdas/treasury";
import { acceptedMintCodec } from "../types/acceptedMint";
import type { AcceptedMint } from "../types/acceptedMint";

export interface InitializeConfigInstructionAccounts {
  authority: PublicKey;
  treasury?: PublicKey;
  config?: PublicKey;
  systemProgram: PublicKey;
}

export interface InitializeConfigInstructionArgs {
  admin: PublicKey;
  orderFeeBps: number;
  acceptedMints: Array<AcceptedMint>;
}

const InitializeConfigInstructionDataCodec = getStructCodec([
  [
    "admin",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["orderFeeBps", getU16Codec()],
  ["acceptedMints", getArrayCodec(acceptedMintCodec)],
]);

export function createInitializeConfigInstruction(
  accounts: InitializeConfigInstructionAccounts,
  args: InitializeConfigInstructionArgs,
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
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: treasury, isSigner: false, isWritable: false },
    { pubkey: config, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(InitializeConfigInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("d07f1501c2bec446", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
