import { PublicKey } from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';
import { TransactionMessage } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { Cluster } from '@solana/web3.js';
import { CuPriceRange, JitoTipRange } from '../server/solana';
import { optimizeTx } from '../api';

export const CLUSTER: Cluster = (process.env.NEXT_PUBLIC_SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;

export const TASK_QUEUE = new PublicKey(
  process.env.NEXT_PUBLIC_SPLURGE_TASK_QUEUE as string
);

export async function getPriorityFee(connection: Connection): Promise<number> {
  const recentFees = await connection.getRecentPrioritizationFees();
  return Math.floor(
    recentFees.reduce(
      (acc, { prioritizationFee }) => acc + prioritizationFee,
      0
    ) / recentFees.length
  );
}

export async function getALTs(
  connection: Connection,
  addresses: PublicKey[]
): Promise<AddressLookupTableAccount[]> {
  const lookupTableAccounts: AddressLookupTableAccount[] = [];

  for (const address of addresses) {
    const account = await connection.getAddressLookupTable(address);

    if (account.value) {
      lookupTableAccounts.push(account.value);
    } else {
      throw new Error(`Lookup table not found: ${address.toBase58()}`);
    }
  }

  return lookupTableAccounts;
}

export async function buildTx(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = [],
  cuPriceRange: CuPriceRange = 'low',
  jitoTipRange: JitoTipRange = 'low'
): Promise<VersionedTransaction> {
  const mainALT = await getALTs(connection, [
    new PublicKey(process.env.NEXT_PUBLIC_ADDRESS_LOOKUP_TABLE as string),
  ]);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions,
  }).compileToV0Message(lookupTables.concat(mainALT));

  const v0Tx = new VersionedTransaction(messageV0);

  return await optimizeTx(v0Tx, cuPriceRange, jitoTipRange);
}
