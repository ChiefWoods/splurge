import { fetchConfig } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { EarningsProvider } from '@/providers/EarningsProvider';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Earnings',
};

export default async function Layout({ children }: { children: ReactNode }) {
  const config = await fetchConfig(SPLURGE_CLIENT);

  if (!config) {
    throw new Error('Config not initialized.');
  }

  return <EarningsProvider config={config}>{children}</EarningsProvider>;
}
