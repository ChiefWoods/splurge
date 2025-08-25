import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import idl from '../idl/splurge.json';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { Splurge } from '@/types/splurge';

export const CLUSTER: Cluster = (process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;
export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER)
);

export const SPLURGE_PROGRAM = new Program<Splurge>(idl, {
  connection: CONNECTION,
});

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
export const ACCEPTED_MINTS_METADATA = new Map<
  string,
  {
    name: string;
    image: string;
    symbol: string;
    owner: PublicKey;
  }
>([
  [
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    {
      name: 'USDC',
      image: '/accepted_mint/usdc.png',
      symbol: 'USDC',
      owner: TOKEN_PROGRAM_ID,
    },
  ],
  [
    'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    {
      name: 'Paypal USD',
      image: '/accepted_mint/pyusd.png',
      symbol: 'PYUSD',
      owner: TOKEN_2022_PROGRAM_ID,
    },
  ],
]);

export const DISCRIMINATOR_SIZE = 8;

export const REDIRECT_DELAY_SECS = 1000;
