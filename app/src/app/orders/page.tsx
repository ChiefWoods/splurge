'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { EmptyResult } from '@/components/EmptyResult';
import { OrderTable } from '@/components/OrderTable';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useOrders } from '@/providers/OrdersProvider';
import { useItems } from '@/providers/ItemsProvider';
import { SectionHeader } from '@/components/SectionHeader';
import { MainSection } from '@/components/MainSection';
import { Wallet2 } from 'lucide-react';

export default function Page() {
  const { publicKey } = useUnifiedWallet();
  const { ordersData, ordersLoading } = useOrders();
  const { itemsData, itemsLoading } = useItems();

  return (
    <MainSection className="flex-1">
      <SectionHeader text="My Orders" />
      {publicKey ? (
        <OrderTable
          itemsData={itemsData}
          ordersData={ordersData}
          isFetching={ordersLoading || itemsLoading}
          statusRenderer={(order) => <StatusBadge status={order.status} />}
          showTotalTooltip={true}
        />
      ) : (
        <EmptyResult
          Icon={Wallet2}
          text="Connect your wallet to view your orders."
        />
      )}
    </MainSection>
  );
}
