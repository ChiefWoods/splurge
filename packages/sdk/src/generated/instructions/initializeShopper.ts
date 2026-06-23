import { addCodecSizePrefix, getStructCodec, getU32Codec, getUtf8Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findShopperPda } from "../pdas/shopper";

export interface InitializeShopperInstructionAccounts {
  authority: PublicKey;
  shopper?: PublicKey;
  systemProgram?: PublicKey;
}

export interface InitializeShopperInstructionArgs {
  name: string;
  image: string;
  address: string;
}

const InitializeShopperInstructionDataCodec = getStructCodec([
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["image", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["address", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function createInitializeShopperInstruction(
  accounts: InitializeShopperInstructionAccounts,
  args: InitializeShopperInstructionArgs,
  programId: PublicKey = SPLURGE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
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
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: shopper, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(InitializeShopperInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("b171575f355a4381", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
