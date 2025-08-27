import { Keypair } from '@solana/web3.js';

export const ADMIN_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR as string))
);
