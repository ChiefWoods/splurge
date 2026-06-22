import { addCodecSizePrefix, getStructCodec, getU32Codec, getUtf8Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findStorePda } from "../pdas/store";

export interface InitializeStoreInstructionAccounts {
  authority: PublicKey;
  store?: PublicKey;
  systemProgram: PublicKey;
}

export interface InitializeStoreInstructionArgs {
  name: string;
  image: string;
  about: string;
}

const InitializeStoreInstructionDataCodec = getStructCodec([
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["image", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["about", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function createInitializeStoreInstruction(
  accounts: InitializeStoreInstructionAccounts,
  args: InitializeStoreInstructionArgs,
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
    { pubkey: store, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(InitializeStoreInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("6d95d2d6bc7edc8c", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
