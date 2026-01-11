import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { getStoreEarnings } from '@/lib/utils';
import { EarningsProvider } from '@/providers/EarningsProvider';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Earnings',
};

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  const earnings = await getStoreEarnings(SPLURGE_CLIENT, storePda);

  return (
    <EarningsProvider fallbackData={earnings} store={storePda}>
      {children}
    </EarningsProvider>
  );
}
