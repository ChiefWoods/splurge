'use client';

import {
  getExplorerLink,
  getSimulationComputeUnits,
} from '@solana-developers/helpers';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CLUSTER } from './constants';
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getComputeLimitIx(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: Array<AddressLookupTableAccount> = []
): Promise<TransactionInstruction | undefined> {
  const units = await getSimulationComputeUnits(
    connection,
    instructions,
    payer,
    lookupTables
  );

  if (units) {
    return ComputeBudgetProgram.setComputeUnitLimit({
      units: Math.ceil(units * 1.1),
    });
  }
}

export async function setComputeUnitLimitAndPrice(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: Array<AddressLookupTableAccount> = []
): Promise<Transaction> {
  const tx = new Transaction();

  const limitIx = await getComputeLimitIx(
    connection,
    instructions,
    payer,
    lookupTables
  );

  if (limitIx) {
    tx.add(limitIx);
  }

  tx.add(await getComputePriceIx(connection), ...instructions);

  return tx;
}

export async function getComputePriceIx(
  connection: Connection
): Promise<TransactionInstruction> {
  const recentFees = await connection.getRecentPrioritizationFees();
  const priorityFee =
    recentFees.reduce(
      (acc, { prioritizationFee }) => acc + prioritizationFee,
      0
    ) / recentFees.length;

  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: BigInt(Math.ceil(priorityFee)),
  });
}

export function getTransactionLink(signature: string): string {
  return getExplorerLink('tx', signature, CLUSTER);
}
