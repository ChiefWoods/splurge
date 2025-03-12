import { IdlAccounts, IdlTypes, ProgramAccount } from '@coral-xyz/anchor';
import { Splurge } from '../types/splurge';

export type Config = IdlAccounts<Splurge>['config'];
export type Shopper = IdlAccounts<Splurge>['shopper'];
export type Store = IdlAccounts<Splurge>['store'];
export type Item = IdlAccounts<Splurge>['item'];
export type Order = IdlAccounts<Splurge>['order'];
export type Review = IdlAccounts<Splurge>['review'];
export type OrderStatus = IdlTypes<Splurge>['orderStatus'];

export type ParsedProgramAccount<T> = T & {
  publicKey: string;
};

export interface ParsedConfig {
  admin: string;
  treasury: string;
  platformLocked: boolean;
  orderFeeBps: number;
  whitelistedMints: string[];
}

export interface ParsedShopper {
  authority: string;
  name: string;
  image: string;
  address: string;
}

export interface ParsedStore {
  authority: string;
  name: string;
  image: string;
  about: string;
}

export interface ParsedItem {
  store: string;
  price: number;
  inventoryCount: number;
  name: string;
  image: string;
  description: string;
}

export interface ParsedOrder {
  shopper: string;
  item: string;
  timestamp: number;
  status: OrderStatus;
  amount: number;
  total: number;
  paymentMint: string;
}

export interface ParsedReview {
  order: string;
  rating: number;
  timestamp: number;
  text: string;
}

export function parseProgramAccount<A, P>(
  programAccount: ProgramAccount,
  parser: (account: A) => P
): ParsedProgramAccount<P> {
  return {
    publicKey: programAccount.publicKey.toBase58(),
    ...parser(programAccount.account),
  };
}

export function parseConfig(config: Config): ParsedConfig {
  return {
    admin: config.admin.toBase58(),
    treasury: config.treasury.toBase58(),
    platformLocked: config.platformLocked,
    orderFeeBps: config.orderFeeBps,
    whitelistedMints: config.whitelistedMints.map((mint) => mint.toBase58()),
  };
}

export function parseShopper(shopper: Shopper): ParsedShopper {
  return {
    authority: shopper.authority.toBase58(),
    name: shopper.name,
    image: shopper.image,
    address: shopper.address,
  };
}

export function parseStore(store: Store): ParsedStore {
  return {
    authority: store.authority.toBase58(),
    name: store.name,
    image: store.image,
    about: store.about,
  };
}

export function parseItem(item: Item): ParsedItem {
  return {
    store: item.store.toBase58(),
    price: item.price,
    inventoryCount: item.inventoryCount,
    name: item.name,
    image: item.image,
    description: item.description,
  };
}

export function parseOrder(order: Order): ParsedOrder {
  return {
    shopper: order.shopper.toBase58(),
    item: order.item.toBase58(),
    timestamp: order.timestamp.toNumber(),
    status: order.status,
    amount: order.amount,
    total: order.total,
    paymentMint: order.paymentMint.toBase58(),
  };
}

export function parseReview(review: Review): ParsedReview {
  return {
    order: review.order.toBase58(),
    rating: review.rating,
    timestamp: review.timestamp.toNumber(),
    text: review.text,
  };
}
