import {
  addCodecSizePrefix,
  getStructCodec,
  getU32Codec,
  getU64Codec,
  getUtf8Codec,
} from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findStorePda } from "../pdas/store";

export interface ListItemInstructionAccounts {
  authority: PublicKey;
  item: PublicKey;
  store?: PublicKey;
  systemProgram: PublicKey;
}

export interface ListItemInstructionArgs {
  price: bigint;
  inventoryCount: number;
  name: string;
  image: string;
  description: string;
}

const ListItemInstructionDataCodec = getStructCodec([
  ["price", getU64Codec()],
  ["inventoryCount", getU32Codec()],
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["image", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["description", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function createListItemInstruction(
  accounts: ListItemInstructionAccounts,
  args: ListItemInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
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
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.item, isSigner: false, isWritable: true },
    { pubkey: store, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(ListItemInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("aef516d3e467790d", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
