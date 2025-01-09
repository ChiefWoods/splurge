import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import idl from '../idl/splurge.json';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);
export const SPLURGE_WALLET = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.NEXT_PUBLIC_SPLURGE_WALLET!))
);
export const CLUSTER =
  (process.env.NEXT_PUBLIC_RPC_CLUSTER as Cluster) ?? 'devnet';
export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl('devnet')
);

export const USER_SEED = 'user';
export const EVENT_SEED = 'event';
export const ATTENDEE_SEED = 'attendee';
export const SPLURGE_CONFIG_SEED = 'splurge_config';
export const SHOPPER_SEED = 'shopper';
export const STORE_SEED = 'store';
export const STORE_ITEM_SEED = 'store_item';
export const ORDER_SEED = 'order';
export const REVIEW_SEED = 'review';

export const MAX_SHOPPER_NAME_LENGTH = 64;
export const MAX_STORE_NAME_LENGTH = 64;
export const MAX_STORE_ITEM_NAME_LENGTH = 32;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
];

// Hardcoded because devnet USDC has no metadata to fetch
export const WHITELISTED_PAYMENT_TOKENS = [
  {
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    name: 'USDC',
    image: '/whitelisted_mint/usdc.png',
    symbol: 'USDC',
    owner: TOKEN_PROGRAM_ID,
  },
  {
    mint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    name: 'Paypal USD',
    image: '/whitelisted_mint/pyusd.png',
    symbol: 'PYUSD',
    owner: TOKEN_2022_PROGRAM_ID,
  },
];
