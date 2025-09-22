import { ItemsProvider } from '@/providers/ItemsProvider';
import { OrdersProvider } from '@/providers/OrdersProvider';
import { ShoppersProvider } from '@/providers/ShoppersProvider';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  return (
    <OrdersProvider storePda={storePda}>
      <ItemsProvider storePda={storePda}>
        <ShoppersProvider>{children}</ShoppersProvider>
      </ItemsProvider>
    </OrdersProvider>
  );
}
