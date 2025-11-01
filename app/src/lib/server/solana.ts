import { clusterApiUrl, Connection } from '@solana/web3.js';
import { Cluster } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';

const CLUSTER: Cluster = (process.env.SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;
export const CONNECTION = new Connection(
  process.env.SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER),
  'confirmed'
);

export const ADMIN_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR as string))
);
