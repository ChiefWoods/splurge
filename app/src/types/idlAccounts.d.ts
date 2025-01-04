import { IdlAccounts, IdlTypes } from '@coral-xyz/anchor';
import { Splurge } from './splurge';

export type SplurgeConfig = IdlAccounts<Splurge>['splurgeConfig'];
export type Shopper = IdlAccounts<Splurge>['shopper'];
export type Store = IdlAccounts<Splurge>['store'];
export type StoreItem = IdlAccounts<Splurge>['storeItem'];
export type Order = IdlAccounts<Splurge>['order'];
export type Review = IdlAccounts<Splurge>['review'];
export type OrderStatus = IdlTypes<Splurge>['orderStatus'];
