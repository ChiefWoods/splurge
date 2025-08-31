import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import idl from '../idl/splurge.json';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Splurge } from '@/types/splurge';
import { HermesClient } from '@pythnetwork/hermes-client';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';
import tuktukIdl from '@/idl/tuktuk.json';

export const CLUSTER: Cluster = (process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;
export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER),
  'confirmed'
);

export const HERMES_CLIENT = new HermesClient(
  process.env.NEXT_PUBLIC_PYTH_HERMES_URL as string
);

const provider = { connection: CONNECTION } as AnchorProvider;
export const SPLURGE_PROGRAM = new Program<Splurge>(idl, provider);
export const TUKTUK_PROGRAM = new Program<Tuktuk>(tuktukIdl, provider);

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
    priceUpdateV2: PublicKey;
    id: string;
  }
>([
  [
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    {
      name: 'USDC',
      image: '/accepted_mint/usdc.png',
      symbol: 'USDC',
      owner: TOKEN_PROGRAM_ID,
      priceUpdateV2: new PublicKey(
        'Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX'
      ),
      id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    },
  ],
  [
    'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    {
      name: 'Paypal USD',
      image: '/accepted_mint/pyusd.png',
      symbol: 'PYUSD',
      owner: TOKEN_2022_PROGRAM_ID,
      priceUpdateV2: new PublicKey(
        '9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k'
      ),
      id: '0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692',
    },
  ],
]);

export const DISCRIMINATOR_SIZE = 8;

export const MINT_DECIMALS = 6;

export const ORDER_TABS = [
  'all',
  'pending',
  'shipping',
  'completed',
  'cancelled',
];

export const TASK_QUEUE = new PublicKey(
  process.env.NEXT_PUBLIC_SPLURGE_TASK_QUEUE as string
);
