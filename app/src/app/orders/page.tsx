'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { NoResultText } from '@/components/NoResultText';
import { OrderTable } from '@/components/OrderTable';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useOrders } from '@/providers/OrdersProvider';
import { useItems } from '@/providers/ItemsProvider';
import { SectionHeader } from '@/components/SectionHeader';
import { MainSection } from '@/components/MainSection';

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
        <NoResultText text="Connect your wallet to view your orders." />
      )}
    </MainSection>
  );
}
