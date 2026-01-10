import { ShopperAccountSection } from '@/components/ShopperAccountSection';
import { fetchShopper } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { PublicKey } from '@solana/web3.js';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ shopperPda: string }>;
}) {
  const { shopperPda } = await params;

  // 404 if PDA is not a valid public key
  try {
    new PublicKey(shopperPda);
  } catch {
    notFound();
  }

  const shopper = await fetchShopper(SPLURGE_CLIENT, shopperPda);

  // 404 if shopper doesn't exist
  if (!shopper) {
    notFound();
  }

  return <ShopperAccountSection shopper={shopper} />;
}
