import {
  addCodecSizePrefix,
  fixCodecSize,
  getBytesCodec,
  getStructCodec,
  getU32Codec,
  getU8Codec,
  getUtf8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, PublicKey } from "@solana/web3.js";

export interface StoreAccountData {
  authority: PublicKey;
  bump: number;
  name: string;
  image: string;
  about: string;
}

export interface StoreAccount {
  address: PublicKey;
  data: StoreAccountData;
}

const StoreAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "authority",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["bump", getU8Codec()],
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["image", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["about", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function deserializeStoreAccount(data: Uint8Array): StoreAccountData {
  const deserialized = StoreAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as StoreAccountData;
}

export async function fetchStoreAccount(
  connection: Connection,
  address: PublicKey,
): Promise<StoreAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Store account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeStoreAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeStoreAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(StoreAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeStoreAccount(accountInfo.data),
    };
  });
}

export async function fetchAllStoreAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<StoreAccount[]> {
  const maybeAccounts = await fetchAllMaybeStoreAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Store account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is StoreAccount => a !== null);
}

export async function fetchProgramAccountsStore(
  connection: Connection,
  programId: PublicKey,
  options?: { commitment?: "processed" | "confirmed" | "finalized" },
): Promise<StoreAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "Nn25MFiXzvM" } }],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeStoreAccount(account.data),
  }));
}
