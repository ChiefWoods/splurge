import {
  addCodecSizePrefix,
  getStructCodec,
  getU32Codec,
  getU8Codec,
  getUtf8Codec,
} from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { SPLURGE_PROGRAM_ID } from "..";
import { findReviewPda } from "../pdas/review";
import { findShopperPda } from "../pdas/shopper";

export interface CreateReviewInstructionAccounts {
  authority: PublicKey;
  shopper?: PublicKey;
  order: PublicKey;
  review?: PublicKey;
  systemProgram?: PublicKey;
}

export interface CreateReviewInstructionArgs {
  text: string;
  rating: number;
}

const CreateReviewInstructionDataCodec = getStructCodec([
  ["text", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["rating", getU8Codec()],
]);

export function createCreateReviewInstruction(
  accounts: CreateReviewInstructionAccounts,
  args: CreateReviewInstructionArgs,
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
  let review = accounts.review;
  if (!review) {
    const [derived] = findReviewPda(
      {
        order: accounts.order,
      },
      programId,
    );
    review = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: shopper, isSigner: false, isWritable: false },
    { pubkey: accounts.order, isSigner: false, isWritable: false },
    { pubkey: review, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(CreateReviewInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("45ed572bee7d2801", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
