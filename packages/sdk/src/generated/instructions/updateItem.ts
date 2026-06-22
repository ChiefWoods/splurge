import { getOptionCodec, getStructCodec, getU32Codec, getU64Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";

export interface UpdateItemInstructionAccounts {
  authority: PublicKey;
  item: PublicKey;
  store: PublicKey;
}

export interface UpdateItemInstructionArgs {
  price: bigint | null;
  inventoryCount: number | null;
}

const UpdateItemInstructionDataCodec = getStructCodec([
  ["price", getOptionCodec(getU64Codec())],
  ["inventoryCount", getOptionCodec(getU32Codec())],
]);

export function createUpdateItemInstruction(
  accounts: UpdateItemInstructionAccounts,
  args: UpdateItemInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
    { pubkey: accounts.item, isSigner: false, isWritable: true },
    { pubkey: accounts.store, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(UpdateItemInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("1cde2cafd8e4abb8", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
