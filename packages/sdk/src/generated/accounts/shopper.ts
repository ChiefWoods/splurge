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
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

export interface ShopperAccountData {
  authority: PublicKey;
  bump: number;
  name: string;
  image: string;
  address: string;
}

export interface ShopperAccount {
  address: PublicKey;
  data: ShopperAccountData;
}

const ShopperAccountDataCodec = getStructCodec([
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
  ["address", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

export function deserializeShopperAccount(data: Uint8Array): ShopperAccountData {
  const deserialized = ShopperAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as ShopperAccountData;
}

export async function fetchShopperAccount(
  connection: Connection,
  address: PublicKey,
): Promise<ShopperAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Shopper account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeShopperAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeShopperAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(ShopperAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeShopperAccount(accountInfo.data),
    };
  });
}

export async function fetchAllShopperAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<ShopperAccount[]> {
  const maybeAccounts = await fetchAllMaybeShopperAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Shopper account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is ShopperAccount => a !== null);
}

export async function fetchProgramAccountsShopper(
  connection: Connection,
  programId: PublicKey,
  options?: {
    commitment?: "processed" | "confirmed" | "finalized";
    filters?: GetProgramAccountsFilter[];
  },
): Promise<ShopperAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "56s75fPshLR" } }, ...(options?.filters ?? [])],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeShopperAccount(account.data),
  }));
}
