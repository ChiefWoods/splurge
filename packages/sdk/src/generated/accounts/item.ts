import {
  addCodecSizePrefix,
  fixCodecSize,
  getBytesCodec,
  getStructCodec,
  getU32Codec,
  getU64Codec,
  getU8Codec,
  getUtf8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, PublicKey } from "@solana/web3.js";

export interface ItemAccountData {
  store: PublicKey;
  price: bigint;
  inventoryCount: number;
  bump: number;
  name: string;
  image: string;
  description: string;
}

export interface ItemAccount {
  address: PublicKey;
  data: ItemAccountData;
}

const ItemAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "store",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["price", getU64Codec()],
  ["inventoryCount", getU32Codec()],
  ["bump", getU8Codec()],
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["image", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
  ["description", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function deserializeItemAccount(data: Uint8Array): ItemAccountData {
  const deserialized = ItemAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as ItemAccountData;
}

export async function fetchItemAccount(
  connection: Connection,
  address: PublicKey,
): Promise<ItemAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Item account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeItemAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeItemAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(ItemAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index],
      data: deserializeItemAccount(accountInfo.data),
    };
  });
}

export async function fetchAllItemAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<ItemAccount[]> {
  const maybeAccounts = await fetchAllMaybeItemAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Item account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is ItemAccount => a !== null);
}

export async function fetchProgramAccountsItem(
  connection: Connection,
  programId: PublicKey,
  options?: { commitment?: "processed" | "confirmed" | "finalized" },
): Promise<ItemAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "GVVN9RX2SX1" } }],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeItemAccount(account.data),
  }));
}
