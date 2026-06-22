import {
  fixCodecSize,
  getBytesCodec,
  getI64Codec,
  getStructCodec,
  getU32Codec,
  getU64Codec,
  getU8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, PublicKey } from "@solana/web3.js";

import { OrderStatus, orderStatusCodec } from "../types/orderStatus";

export interface OrderAccountData {
  shopper: PublicKey;
  item: PublicKey;
  timestamp: bigint;
  status: OrderStatus;
  amount: number;
  paymentSubtotal: bigint;
  platformFee: bigint;
  paymentMint: PublicKey;
  bump: number;
}

export interface OrderAccount {
  address: PublicKey;
  data: OrderAccountData;
}

const OrderAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "shopper",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  [
    "item",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["timestamp", getI64Codec()],
  ["status", orderStatusCodec],
  ["amount", getU32Codec()],
  ["paymentSubtotal", getU64Codec()],
  ["platformFee", getU64Codec()],
  [
    "paymentMint",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["bump", getU8Codec()],
]);

export function deserializeOrderAccount(data: Uint8Array): OrderAccountData {
  const deserialized = OrderAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as OrderAccountData;
}

export async function fetchOrderAccount(
  connection: Connection,
  address: PublicKey,
): Promise<OrderAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Order account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeOrderAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeOrderAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(OrderAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index],
      data: deserializeOrderAccount(accountInfo.data),
    };
  });
}

export async function fetchAllOrderAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<OrderAccount[]> {
  const maybeAccounts = await fetchAllMaybeOrderAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i].toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Order account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is OrderAccount => a !== null);
}

export async function fetchProgramAccountsOrder(
  connection: Connection,
  programId: PublicKey,
  options?: { commitment?: "processed" | "confirmed" | "finalized" },
): Promise<OrderAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "PXZJQQ2HEmx" } }, { dataSize: 134 }],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeOrderAccount(account.data),
  }));
}
