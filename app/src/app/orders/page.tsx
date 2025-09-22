'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { NoResultText } from '@/components/NoResultText';
import { OrderTable } from '@/components/OrderTable';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useOrders } from '@/providers/OrdersProvider';
import { useItems } from '@/providers/ItemsProvider';

export default function Page() {
  const { publicKey } = useUnifiedWallet();
  const { ordersData, ordersLoading } = useOrders();
  const { itemsData, itemsLoading } = useItems();

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">My Orders</h2>
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
    </section>
  );
}
