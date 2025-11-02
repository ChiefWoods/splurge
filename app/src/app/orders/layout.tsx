'use client';

import { ItemsProvider } from '@/providers/ItemsProvider';
import { OrdersProvider } from '@/providers/OrdersProvider';
import { useProgram } from '@/providers/ProgramProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();
  const { splurgeClient } = useProgram();

  if (!publicKey) {
    return <>{children}</>;
  }

  const shopperPda = splurgeClient.getShopperPda(publicKey).toBase58();

  return (
    <OrdersProvider shopperPda={shopperPda}>
      <ItemsProvider>{children}</ItemsProvider>
    </OrdersProvider>
  );
}
