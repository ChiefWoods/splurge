import { fixCodecSize, getBytesCodec, getStructCodec, transformCodec } from "@solana/codecs";
import { PublicKey } from "@solana/web3.js";

export interface AcceptedMint {
  mint: PublicKey;
  priceUpdateV2: PublicKey;
}

export const acceptedMintCodec = getStructCodec([
  [
    "mint",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  [
    "priceUpdateV2",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
]);
