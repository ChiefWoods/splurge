import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MINT_DECIMALS } from './constants';

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
  decimals: number = MINT_DECIMALS
): string {
  return (atomic / 10 ** decimals).toFixed(2);
}
