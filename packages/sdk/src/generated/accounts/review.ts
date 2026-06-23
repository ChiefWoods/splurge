import {
  addCodecSizePrefix,
  fixCodecSize,
  getBytesCodec,
  getI64Codec,
  getStructCodec,
  getU32Codec,
  getU8Codec,
  getUtf8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

export interface ReviewAccountData {
  order: PublicKey;
  rating: number;
  timestamp: bigint;
  bump: number;
  text: string;
}

export interface ReviewAccount {
  address: PublicKey;
  data: ReviewAccountData;
}

const ReviewAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "order",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["rating", getU8Codec()],
  ["timestamp", getI64Codec()],
  ["bump", getU8Codec()],
  ["text", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function deserializeReviewAccount(data: Uint8Array): ReviewAccountData {
  const deserialized = ReviewAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as ReviewAccountData;
}

export async function fetchReviewAccount(
  connection: Connection,
  address: PublicKey,
): Promise<ReviewAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Review account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeReviewAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeReviewAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(ReviewAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeReviewAccount(accountInfo.data),
    };
  });
}

export async function fetchAllReviewAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<ReviewAccount[]> {
  const maybeAccounts = await fetchAllMaybeReviewAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Review account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is ReviewAccount => a !== null);
}

export async function fetchProgramAccountsReview(
  connection: Connection,
  programId: PublicKey,
  options?: {
    commitment?: "processed" | "confirmed" | "finalized";
    filters?: GetProgramAccountsFilter[];
  },
): Promise<ReviewAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "MnNdWPhT1iv" } }, ...(options?.filters ?? [])],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeReviewAccount(account.data),
  }));
}
