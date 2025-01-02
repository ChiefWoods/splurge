import { PublicKey } from '@solana/web3.js';
import idl from '../target/idl/splurge.json';

export const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);
export const SPLURGE_CONFIG_SEED = 'splurge_config';
export const SHOPPER_SEED = 'shopper';
export const STORE_SEED = 'store';
export const STORE_ITEM_SEED = 'store_item';
export const ORDER_SEED = 'order';
export const REVIEW_SEED = 'review';
export const MAX_SHOPPER_NAME_LEN = 64;
export const MAX_STORE_NAME_LEN = 64;
export const MAX_STORE_ITEM_NAME_LEN = 32;
