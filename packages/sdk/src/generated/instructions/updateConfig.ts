import {
  fixCodecSize,
  getArrayCodec,
  getBooleanCodec,
  getBytesCodec,
  getOptionCodec,
  getStructCodec,
  getU16Codec,
  transformCodec,
} from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findConfigPda } from "../pdas/config";
import { AcceptedMint, acceptedMintCodec } from "../types/acceptedMint";

export interface UpdateConfigInstructionAccounts {
  admin: PublicKey;
  config?: PublicKey;
  systemProgram?: PublicKey;
}

export interface UpdateConfigInstructionArgs {
  newAdmin: PublicKey | null;
  isPaused: boolean | null;
  orderFeeBps: number | null;
  acceptedMints: Array<AcceptedMint> | null;
}

const UpdateConfigInstructionDataCodec = getStructCodec([
  [
    "newAdmin",
    getOptionCodec(
      transformCodec(
        fixCodecSize(getBytesCodec(), 32),
        (value: PublicKey) => value.toBytes(),
        (value) => new PublicKey(value),
      ),
    ),
  ],
  ["isPaused", getOptionCodec(getBooleanCodec())],
  ["orderFeeBps", getOptionCodec(getU16Codec())],
  ["acceptedMints", getOptionCodec(getArrayCodec(acceptedMintCodec))],
]);

export function createUpdateConfigInstruction(
  accounts: UpdateConfigInstructionAccounts,
  args: UpdateConfigInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  let config = accounts.config;
  if (!config) {
    const [derived] = findConfigPda(programId);
    config = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(UpdateConfigInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("1d9efcbf0a53db63", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
