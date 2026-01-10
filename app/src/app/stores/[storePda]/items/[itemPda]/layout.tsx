import { fetchItem } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { ItemProvider } from '@/providers/ItemProvider';
import { PublicKey } from '@solana/web3.js';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemPda: string }>;
}): Promise<Metadata> {
  const { itemPda } = await params;

  // validate PDA
  try {
    new PublicKey(itemPda);
  } catch {
    return {
      title: '404',
    };
  }

  const item = await fetchItem(SPLURGE_CLIENT, itemPda);

  if (!item) {
    return {
      title: '404',
    };
  }

  return {
    title: item.name,
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ itemPda: string }>;
}) {
  const { itemPda } = await params;

  // 404 if PDA is not a valid public key
  try {
    new PublicKey(itemPda);
  } catch {
    notFound();
  }

  const item = await fetchItem(SPLURGE_CLIENT, itemPda);

  // 404 if item doesn't exist
  if (!item) {
    notFound();
  }

  return <ItemProvider fallbackData={item}>{children}</ItemProvider>;
}
