import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { VersionedTransaction } from '@solana/web3.js';
import { MINT_DECIMALS } from './constants';
import { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, length: number = 4): string {
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

export function getRelativeTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp * 1000);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Future dates
  if (diffMs < 0) {
    const absDiffSeconds = Math.abs(diffSeconds);
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffSeconds < 60) return 'in a few seconds';
    if (absDiffMinutes < 60) return `in ${absDiffMinutes}m`;
    if (absDiffHours < 24) return `in ${absDiffHours}h`;
    if (absDiffDays < 7) return `in ${absDiffDays}d`;
    return `in ${Math.floor(absDiffDays / 7)}w`;
  }

  // Past dates
  if (diffSeconds < 30) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

export function v0TxToBase64(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}

export async function tryGetTokenAccountBalance(
  connection: Connection,
  address: PublicKey
): Promise<number> {
  let balance: number = 0;

  try {
    const accountInfo = await connection.getTokenAccountBalance(address);
    balance = Number(accountInfo.value.amount);
  } catch {
    // noop
  }

  return balance;
}
