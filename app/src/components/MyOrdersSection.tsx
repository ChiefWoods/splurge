'use client';

import { OrderTable } from './OrderTable';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ConnectWalletEmpty } from './ConnectWalletEmpty';
import { SplurgeClient } from '@/classes/SplurgeClient';
import { ParsedItem, ParsedOrder } from '@/types/accounts';
import useSWR from 'swr';
import { wrappedFetch } from '@/lib/api';
import { CommonSection } from './CommonSection';

export function MyOrdersSection({ items }: { items: ParsedItem[] }) {
  const { publicKey } = useUnifiedWallet();

  // orders under the connected wallet's shopper
  const { data: ordersData, isLoading: ordersLoading } = useSWR(
    publicKey ? { publicKey } : null,
    async ({ publicKey }) => {
      const shopperPda = SplurgeClient.getShopperPda(publicKey).toBase58();

      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/orders`
      );

      url.searchParams.append('shopper', shopperPda);

      const orders = (await wrappedFetch(url.href)).orders as ParsedOrder[];

      return orders;
    }
  );

  if (!publicKey) {
    return <ConnectWalletEmpty />;
  }

  return (
    <CommonSection className="items-start">
      <SectionHeader text="My Orders" />
      <OrderTable
        items={items}
        orders={ordersData}
        isFetching={ordersLoading}
        statusRenderer={(order) => <StatusBadge status={order.status} />}
        showTotalTooltip={true}
      />
    </CommonSection>
  );
}
