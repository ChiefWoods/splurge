import { ItemsProvider } from '@/providers/ItemsProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { PublicKey } from '@solana/web3.js';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  try {
    new PublicKey(storePda);
  } catch {
    notFound();
  }

  return (
    <StoreProvider pda={storePda}>
      <ItemsProvider storePda={storePda}>{children}</ItemsProvider>
    </StoreProvider>
  );
}
