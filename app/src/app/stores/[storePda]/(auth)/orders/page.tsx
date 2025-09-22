'use client';

import { UpdateOrderDialog } from '@/components/formDialogs/UpdateOrderDialog';
import { OrderTable } from '@/components/OrderTable';
import { StatusBadge } from '@/components/StatusBadge';
import { useItems } from '@/providers/ItemsProvider';
import { useOrders } from '@/providers/OrdersProvider';
import { useShoppers } from '@/providers/ShoppersProvider';
import { useParams } from 'next/navigation';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { ordersData, ordersLoading } = useOrders();
  const { itemsData, itemsLoading } = useItems();
  const { shoppersData, shoppersLoading } = useShoppers();

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">Manage Orders</h2>
      <OrderTable
        itemsData={itemsData}
        ordersData={ordersData}
        isFetching={ordersLoading || itemsLoading || shoppersLoading}
        statusRenderer={(order) => {
          if (order.status === 'pending') {
            const orderItem = itemsData?.find(
              ({ publicKey }) => publicKey === order.item
            );

            if (!orderItem) {
              throw new Error('Matching item not found for order.');
            }

            const orderShopper = shoppersData?.find(
              ({ publicKey }) => publicKey === order.shopper
            );

            if (!orderShopper) {
              throw new Error('Matching shopper not found for order.');
            }

            return (
              <UpdateOrderDialog
                address={orderShopper.address}
                amount={order.amount}
                image={orderItem.image}
                name={orderItem.name}
                status={order.status}
                orderPda={order.publicKey}
                paymentSubtotal={order.paymentSubtotal}
                orderTimestamp={order.timestamp}
                itemPda={order.item}
                paymentMint={order.paymentMint}
                storePda={storePda}
                authority={orderShopper.authority}
              />
            );
          } else {
            return <StatusBadge status={order.status} />;
          }
        }}
      />
    </section>
  );
}
