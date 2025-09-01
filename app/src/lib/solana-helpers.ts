import {
  getExplorerLink,
  getSimulationComputeUnits,
} from '@solana-developers/helpers';
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { CLUSTER, CONNECTION } from './constants';

export async function buildTx(
  ixs: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = []
) {
  const mainALT = await getALTs([
    new PublicKey(process.env.NEXT_PUBLIC_ADDRESS_LOOKUP_TABLE as string),
  ]);

  const units = await getSimulationComputeUnits(
    CONNECTION,
    ixs,
    payer,
    lookupTables.concat(mainALT)
  );

  if (!units) {
    throw new Error('Unable to get compute limits.');
  }

  const recentFees = await CONNECTION.getRecentPrioritizationFees();
  const priorityFee = Math.floor(
    recentFees.reduce(
      (acc, { prioritizationFee }) => acc + prioritizationFee,
      0
    ) / recentFees.length
  );

  const ixsWithCompute = [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: Math.ceil(units * 1.1),
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    }),
    ...ixs,
  ];

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: (await CONNECTION.getLatestBlockhash()).blockhash,
    instructions: ixsWithCompute,
  }).compileToV0Message(lookupTables);

  return new VersionedTransaction(messageV0);
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

export function getTransactionLink(signature: string): string {
  return getExplorerLink('tx', signature, CLUSTER);
}

export function getAccountLink(address: string): string {
  return getExplorerLink('address', address, CLUSTER);
}
