import { getU8Codec } from "@solana/codecs";

export enum OrderStatus {
  Pending,
  Shipping,
  Cancelled,
  Completed,
}

export const orderStatusCodec = getU8Codec();
