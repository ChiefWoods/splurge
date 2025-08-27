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
