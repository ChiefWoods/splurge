import {
  AcceptedMint,
  ConfigAccountData,
  ItemAccountData,
  OrderAccountData,
  OrderStatus,
  ReviewAccountData,
  ShopperAccountData,
  StoreAccountData,
} from "@splurge/sdk";

import { parseBigInt, ParsedProgramAccount, parsePublicKey } from "./parse";

export type ParsedOrderStatus = "pending" | "shipping" | "cancelled" | "completed";

interface ParsedAcceptedMint {
  mint: string;
  priceUpdateV2: string;
}

export interface ParsedConfig extends ParsedProgramAccount {
  data: Omit<ConfigAccountData, "admin" | "acceptedMints" | "reserved"> & {
    admin: string;
    acceptedMints: ParsedAcceptedMint[];
    reserved: number[];
  };
}

export interface ParsedShopper extends ParsedProgramAccount {
  data: Omit<ShopperAccountData, "authority"> & { authority: string };
}

export interface ParsedStore extends ParsedProgramAccount {
  data: Omit<StoreAccountData, "authority"> & { authority: string };
}

export interface ParsedItem extends ParsedProgramAccount {
  data: Omit<ItemAccountData, "store" | "price"> & { store: string; price: string };
}

export interface ParsedOrder extends ParsedProgramAccount {
  data: Omit<
    OrderAccountData,
    "shopper" | "item" | "timestamp" | "status" | "paymentSubtotal" | "platformFee" | "paymentMint"
  > & {
    shopper: string;
    item: string;
    timestamp: string;
    status: ParsedOrderStatus;
    paymentSubtotal: string;
    platformFee: string;
    paymentMint: string;
  };
}

export interface ParsedReview extends ParsedProgramAccount {
  data: Omit<ReviewAccountData, "order" | "timestamp"> & { order: string; timestamp: string };
}

function parseAcceptedMints(acceptedMints: AcceptedMint[]): ParsedAcceptedMint[] {
  return acceptedMints.map((mint) => ({
    mint: parsePublicKey(mint.mint),
    priceUpdateV2: parsePublicKey(mint.priceUpdateV2),
  }));
}

export function parseConfig({
  admin,
  isPaused,
  orderFeeBps,
  bump,
  treasuryBump,
  acceptedMints,
  reserved,
}: ConfigAccountData): ParsedConfig["data"] {
  return {
    admin: parsePublicKey(admin),
    isPaused,
    orderFeeBps,
    bump,
    treasuryBump,
    acceptedMints: parseAcceptedMints(acceptedMints),
    reserved: Array.from(reserved),
  };
}

export function parseShopper({
  authority,
  name,
  image,
  address,
  bump,
}: ShopperAccountData): ParsedShopper["data"] {
  return {
    authority: parsePublicKey(authority),
    bump,
    name,
    image,
    address,
  };
}

export function parseStore({
  authority,
  name,
  image,
  about,
  bump,
}: StoreAccountData): ParsedStore["data"] {
  return {
    authority: parsePublicKey(authority),
    bump,
    name,
    image,
    about,
  };
}

export function parseItem({
  store,
  price,
  inventoryCount,
  name,
  image,
  description,
  bump,
}: ItemAccountData): ParsedItem["data"] {
  return {
    store: parsePublicKey(store),
    price: parseBigInt(price),
    inventoryCount,
    bump,
    name,
    image,
    description,
  };
}

export function parseOrder({
  shopper,
  item,
  timestamp,
  status,
  amount,
  paymentSubtotal,
  platformFee,
  paymentMint,
  bump,
}: OrderAccountData): ParsedOrder["data"] {
  return {
    shopper: parsePublicKey(shopper),
    item: parsePublicKey(item),
    timestamp: parseBigInt(timestamp),
    status: OrderStatus[status].toLowerCase() as ParsedOrderStatus,
    amount,
    paymentSubtotal: parseBigInt(paymentSubtotal),
    platformFee: parseBigInt(platformFee),
    paymentMint: parsePublicKey(paymentMint),
    bump,
  };
}

export function parseReview({
  order,
  rating,
  timestamp,
  text,
  bump,
}: ReviewAccountData): ParsedReview["data"] {
  return {
    order: parsePublicKey(order),
    rating,
    timestamp: parseBigInt(timestamp),
    bump,
    text,
  };
}
