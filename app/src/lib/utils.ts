import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  DISCRIMINATOR_SIZE,
  MINT_DECIMALS,
  SPLURGE_PROGRAM,
} from './constants';
import { TransactionMessage, VersionedTransaction } from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, length: number = 4): string {
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getElapsedTime(timestamp: number): string {
  const milliseconds = Date.now() - timestamp;
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  if (seconds > 0) return `${seconds}s`;
  return 'now';
}

export function atomicToUsd(
  atomic: number,
  precision: number = 2,
  decimals: number = MINT_DECIMALS
): string {
  return (atomic / 10 ** decimals).toFixed(precision);
}

export function removeTrailingZeroes(price: string): string {
  return price.replace(/\.?0+$/, '');
}

export async function validateProgramIx(
  tx: VersionedTransaction,
  ixName: string
): Promise<boolean> {
  const { instructions } = TransactionMessage.decompile(tx.message);

  const ix = instructions.find((ix) =>
    ix.programId.equals(SPLURGE_PROGRAM.programId)
  );

  if (!ix) {
    return false;
  }

  const discriminator = ix.data.subarray(0, DISCRIMINATOR_SIZE);
  const hash = await crypto.subtle.digest(
    'SHA-256',
    Buffer.from(`global:${ixName}`)
  );
  const expected = Buffer.from(hash).subarray(0, DISCRIMINATOR_SIZE);

  return discriminator.equals(expected);
}
