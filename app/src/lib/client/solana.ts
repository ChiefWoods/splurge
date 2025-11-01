import { Splurge } from '@/types/splurge';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';
import { getExplorerLink } from '@solana-developers/helpers';
import { PublicKey } from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';
import { TransactionMessage } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { Cluster } from '@solana/web3.js';
import idl from '../../idl/splurge.json';
import tuktukIdl from '@/idl/tuktuk.json';
import { CuPriceRange, JitoTipRange } from '../server/solana';
import { optimizeTx } from '../api';

export const CLUSTER: Cluster = (process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;
export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER),
  'confirmed'
);

const provider = { connection: CONNECTION } as AnchorProvider;
export const SPLURGE_PROGRAM = new Program<Splurge>(idl, provider);
export const TUKTUK_PROGRAM = new Program<Tuktuk>(tuktukIdl, provider);

export const TASK_QUEUE = new PublicKey(
  process.env.NEXT_PUBLIC_SPLURGE_TASK_QUEUE as string
);

export async function getPriorityFee(): Promise<number> {
  const recentFees = await CONNECTION.getRecentPrioritizationFees();
  return Math.floor(
    recentFees.reduce(
      (acc, { prioritizationFee }) => acc + prioritizationFee,
      0
    ) / recentFees.length
  );
}

export async function getALTs(
  addresses: PublicKey[]
): Promise<AddressLookupTableAccount[]> {
  const lookupTableAccounts: AddressLookupTableAccount[] = [];

  for (const address of addresses) {
    const account = await CONNECTION.getAddressLookupTable(address);

    if (account.value) {
      lookupTableAccounts.push(account.value);
    } else {
      throw new Error(`Lookup table not found: ${address.toBase58()}`);
    }
  }

  return lookupTableAccounts;
}

export async function buildTx(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = [],
  cuPriceRange: CuPriceRange = 'low',
  jitoTipRange: JitoTipRange = 'low'
): Promise<VersionedTransaction> {
  const mainALT = await getALTs([
    new PublicKey(process.env.NEXT_PUBLIC_ADDRESS_LOOKUP_TABLE as string),
  ]);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: (await CONNECTION.getLatestBlockhash()).blockhash,
    instructions,
  }).compileToV0Message(lookupTables.concat(mainALT));

  const v0Tx = new VersionedTransaction(messageV0);

  return await optimizeTx(v0Tx, cuPriceRange, jitoTipRange);
}

export function getTransactionLink(signature: string): string {
  return getExplorerLink('tx', signature, CLUSTER);
}

export function getAccountLink(address: string): string {
  return getExplorerLink('address', address, CLUSTER);
}
