import { BN, IdlAccounts, IdlTypes } from '@coral-xyz/anchor';
import { Splurge } from './splurge';
import { PublicKey, SystemProgram } from '@solana/web3.js';

type Config = IdlAccounts<Splurge>['config'];
type Shopper = IdlAccounts<Splurge>['shopper'];
type Store = IdlAccounts<Splurge>['store'];
type Item = IdlAccounts<Splurge>['item'];
type Order = IdlAccounts<Splurge>['order'];
type Review = IdlAccounts<Splurge>['review'];
type AcceptedMint = IdlTypes<Splurge>['acceptedMint'];
export type InitializeShopperArgs = IdlTypes<Splurge>['initializeShopperArgs'];
export type InitializeStoreArgs = IdlTypes<Splurge>['initializeStoreArgs'];
export type ListItemArgs = IdlTypes<Splurge>['listItemArgs'];
export type UpdateItemArgs = IdlTypes<Splurge>['updateItemArgs'];
export type CreateReviewArgs = IdlTypes<Splurge>['createReviewArgs'];

export enum ParsedOrderStatus {
  Pending = 'pending',
  Shipping = 'shipping',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export interface ParsedProgramAccount {
  publicKey: string;
}

interface ParsedAcceptedMint {
  mint: string;
  priceUpdateV2: string;
}

export interface ParsedConfig extends ParsedProgramAccount {
  orderFeeBps: number;
  admin: string;
  isPaused: boolean;
  acceptedMints: ParsedAcceptedMint[];
}

export interface ParsedShopper extends ParsedProgramAccount {
  authority: string;
  name: string;
  image: string;
  address: string;
}

export interface ParsedStore extends ParsedProgramAccount {
  authority: string;
  name: string;
  image: string;
  about: string;
}

export interface ParsedItem extends ParsedProgramAccount {
  store: string;
  price: number;
  inventoryCount: number;
  name: string;
  image: string;
  description: string;
}

export interface ParsedOrder extends ParsedProgramAccount {
  shopper: string;
  item: string;
  timestamp: number;
  status: ParsedOrderStatus;
  amount: number;
  paymentSubtotal: number;
  platformFee: number;
  paymentMint: string;
}

export interface ParsedReview extends ParsedProgramAccount {
  order: string;
  rating: number;
  timestamp: number;
  text: string;
}

export function parseEnum<T>(field: object): T {
  return Object.keys(field)[0] as T;
}

function parsePublicKey(field: PublicKey | null): string {
  return !field || field.equals(SystemProgram.programId)
    ? ''
    : field.toBase58();
}

function parseBN(field: BN): number {
  return field.toNumber();
}

function parseAcceptedMints(
  acceptedMints: AcceptedMint[]
): ParsedAcceptedMint[] {
  return acceptedMints.map((mint) => ({
    mint: parsePublicKey(mint.mint),
    priceUpdateV2: parsePublicKey(mint.priceUpdateV2),
  }));
}

export function parseConfig({
  admin,
  isPaused,
  orderFeeBps,
  acceptedMints,
}: Config): Omit<ParsedConfig, 'publicKey'> {
  return {
    admin: parsePublicKey(admin),
    isPaused,
    orderFeeBps,
    acceptedMints: parseAcceptedMints(acceptedMints),
  };
}

export function parseShopper({
  authority,
  name,
  image,
  address,
}: Shopper): Omit<ParsedShopper, 'publicKey'> {
  return {
    authority: parsePublicKey(authority),
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
}: Store): Omit<ParsedStore, 'publicKey'> {
  return {
    authority: parsePublicKey(authority),
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
}: Item): Omit<ParsedItem, 'publicKey'> {
  return {
    store: parsePublicKey(store),
    price: parseBN(price),
    inventoryCount,
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
}: Order): Omit<ParsedOrder, 'publicKey'> {
  return {
    shopper: parsePublicKey(shopper),
    item: parsePublicKey(item),
    timestamp: parseBN(timestamp),
    status: parseEnum<ParsedOrderStatus>(status),
    amount,
    paymentSubtotal: parseBN(paymentSubtotal),
    platformFee: parseBN(platformFee),
    paymentMint: parsePublicKey(paymentMint),
  };
}

export function parseReview({
  order,
  rating,
  timestamp,
  text,
}: Review): Omit<ParsedReview, 'publicKey'> {
  return {
    order: parsePublicKey(order),
    rating,
    timestamp: parseBN(timestamp),
    text,
  };
}
