import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { Metadata } from 'next';
import { PublicKey } from '@solana/web3.js';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { fetchShopper } from '@/lib/accounts';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shopperPda: string }>;
}): Promise<Metadata> {
  const { shopperPda } = await params;

  // validate PDA
  try {
    new PublicKey(shopperPda);
  } catch {
    return {
      title: '404',
    };
  }

  const shopper = await fetchShopper(SPLURGE_CLIENT, shopperPda);

  if (!shopper) {
    return {
      title: '404',
    };
  }

  return {
    title: shopper.name,
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ shopperPda: string }>;
}) {
  const { shopperPda } = await params;

  // 404 if PDA is not a valid public key
  try {
    new PublicKey(shopperPda);
  } catch {
    notFound();
  }

  return children;
}
