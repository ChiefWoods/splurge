import {
  fixCodecSize,
  getBytesCodec,
  getStructCodec,
  getU64Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, PublicKey } from "@solana/web3.js";

import { PriceFeedMessage, priceFeedMessageCodec } from "../types/priceFeedMessage";
import { VerificationLevel, verificationLevelCodec } from "../types/verificationLevel";

export interface PriceUpdateV2AccountData {
  writeAuthority: PublicKey;
  verificationLevel: VerificationLevel;
  priceMessage: PriceFeedMessage;
  postedSlot: bigint;
}

export interface PriceUpdateV2Account {
  address: PublicKey;
  data: PriceUpdateV2AccountData;
}

const PriceUpdateV2AccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "writeAuthority",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["verificationLevel", verificationLevelCodec],
  ["priceMessage", priceFeedMessageCodec],
  ["postedSlot", getU64Codec()],
]);

export function deserializePriceUpdateV2Account(data: Uint8Array): PriceUpdateV2AccountData {
  const deserialized = PriceUpdateV2AccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as PriceUpdateV2AccountData;
}

export async function fetchPriceUpdateV2Account(
  connection: Connection,
  address: PublicKey,
): Promise<PriceUpdateV2Account> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("PriceUpdateV2 account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializePriceUpdateV2Account(accountInfo.data),
  };
}

export async function fetchAllMaybePriceUpdateV2Accounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(PriceUpdateV2Account | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index],
      data: deserializePriceUpdateV2Account(accountInfo.data),
    };
  });
}

export async function fetchAllPriceUpdateV2Accounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<PriceUpdateV2Account[]> {
  const maybeAccounts = await fetchAllMaybePriceUpdateV2Accounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("PriceUpdateV2 account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is PriceUpdateV2Account => a !== null);
}

export async function fetchProgramAccountsPriceUpdateV2(
  connection: Connection,
  programId: PublicKey,
  options?: { commitment?: "processed" | "confirmed" | "finalized" },
): Promise<PriceUpdateV2Account[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "6qysuKPhdDe" } }],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializePriceUpdateV2Account(account.data),
  }));
}
