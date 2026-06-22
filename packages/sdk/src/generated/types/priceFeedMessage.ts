import {
  fixCodecSize,
  getBytesCodec,
  getI32Codec,
  getI64Codec,
  getStructCodec,
  getU64Codec,
} from "@solana/codecs";

export interface PriceFeedMessage {
  feedId: Uint8Array;
  price: bigint;
  conf: bigint;
  exponent: number;
  publishTime: bigint;
  prevPublishTime: bigint;
  emaPrice: bigint;
  emaConf: bigint;
}

export const priceFeedMessageCodec = getStructCodec([
  ["feedId", fixCodecSize(getBytesCodec(), 32)],
  ["price", getI64Codec()],
  ["conf", getU64Codec()],
  ["exponent", getI32Codec()],
  ["publishTime", getI64Codec()],
  ["prevPublishTime", getI64Codec()],
  ["emaPrice", getI64Codec()],
  ["emaConf", getU64Codec()],
]);
