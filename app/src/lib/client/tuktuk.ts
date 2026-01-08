import { PublicKey } from '@solana/web3.js';

export const TASK_QUEUE = new PublicKey(
  process.env.NEXT_PUBLIC_SPLURGE_TASK_QUEUE as string
);
