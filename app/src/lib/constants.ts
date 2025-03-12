import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import idl from '../idl/splurge.json';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);

export const CLUSTER: Cluster | 'localnet' =
  process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER === 'localnet'
    ? 'localnet'
    : ((process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER ?? 'devnet') as Cluster);
const DEFAULT_CLUSTER = CLUSTER !== 'localnet' ? CLUSTER : 'devnet';
export const SERVER_CONNECTION = new Connection(
  process.env.SOLANA_RPC_URL ?? clusterApiUrl(DEFAULT_CLUSTER)
);
export const CLIENT_CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(DEFAULT_CLUSTER)
);

export const ADDRESS_LOOKUP_TABLE = process.env.NEXT_PUBLIC_ADDRESS_LOOKUP_TABLE
  ? (
      await CLIENT_CONNECTION.getAddressLookupTable(
        new PublicKey(process.env.NEXT_PUBLIC_ADDRESS_LOOKUP_TABLE)
      )
    ).value
  : undefined;

export const CONFIG_SEED = 'config';
export const SHOPPER_SEED = 'shopper';
export const STORE_SEED = 'store';
export const ITEM_SEED = 'item';
export const ORDER_SEED = 'order';
export const REVIEW_SEED = 'review';

export const MAX_SHOPPER_NAME_LENGTH = 64;
export const MAX_STORE_NAME_LENGTH = 64;
export const MAX_ITEM_NAME_LENGTH = 32;

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
