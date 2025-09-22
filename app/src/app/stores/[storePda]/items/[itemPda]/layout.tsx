import { ItemProvider } from '@/providers/ItemProvider';
import { OrdersProvider } from '@/providers/OrdersProvider';
import { ReviewsProvider } from '@/providers/ReviewsProvider';
import { ShoppersProvider } from '@/providers/ShoppersProvider';
import { PublicKey } from '@solana/web3.js';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string; itemPda: string }>;
}) {
  const { storePda, itemPda } = await params;

  try {
    new PublicKey(itemPda);
  } catch {
    notFound();
  }

  return (
    <ItemProvider pda={itemPda}>
      <OrdersProvider storePda={storePda}>
        <ReviewsProvider itemPda={itemPda}>
          <ShoppersProvider>{children}</ShoppersProvider>
        </ReviewsProvider>
      </OrdersProvider>
    </ItemProvider>
  );
}
