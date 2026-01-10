import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { Metadata } from 'next';
import { PublicKey } from '@solana/web3.js';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { fetchAllItems, fetchStore } from '@/lib/accounts';
import { ItemsProvider } from '@/providers/ItemsProvider';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storePda: string }>;
}): Promise<Metadata> {
  const { storePda } = await params;

  // validate PDA
  try {
    new PublicKey(storePda);
  } catch {
    return {
      title: '404',
    };
  }

  const store = await fetchStore(SPLURGE_CLIENT, storePda);

  if (!store) {
    return {
      title: '404',
    };
  }

  return {
    title: {
      default: store.name,
      template: '%s | Splurge',
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  // 404 if PDA is not a valid public key
  try {
    new PublicKey(storePda);
  } catch {
    notFound();
  }

  const items = await fetchAllItems(SPLURGE_CLIENT, { store: storePda });

  return (
    <ItemsProvider fallbackData={items} store={storePda}>
      {children}
    </ItemsProvider>
  );
}
