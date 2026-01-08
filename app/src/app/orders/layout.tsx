'use client';

import { SplurgeClient } from '@/classes/SplurgeClient';
import { ItemsProvider } from '@/providers/ItemsProvider';
import { OrdersProvider } from '@/providers/OrdersProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  if (!publicKey) {
    return <>{children}</>;
  }

  const shopperPda = SplurgeClient.getShopperPda(publicKey).toBase58();

  return (
    <OrdersProvider shopperPda={shopperPda}>
      <ItemsProvider>{children}</ItemsProvider>
    </OrdersProvider>
  );
}
