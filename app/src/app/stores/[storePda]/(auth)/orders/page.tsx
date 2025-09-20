'use client';

import { UpdateOrderDialog } from '@/components/formDialogs/UpdateOrderDialog';
import { OrderTable } from '@/components/OrderTable';
import { StatusBadge } from '@/components/StatusBadge';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { allOrdersData, allOrdersIsMutating, allOrdersTrigger } = useOrder();
  const { allItemsData, allItemsIsMutating, allItemsTrigger } = useItem();
  const { allShoppersData, allShoppersIsMutating, allShoppersTrigger } =
    useShopper();

  useEffect(() => {
    (async () => {
      await allItemsTrigger({ storePda });
      await allShoppersTrigger();
      await allOrdersTrigger({
        storePda,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePda]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">Manage Orders</h2>
      <OrderTable
        allItemsData={allItemsData}
        allOrdersData={allOrdersData}
        isFetching={
          allOrdersIsMutating || allItemsIsMutating || allShoppersIsMutating
        }
        statusRenderer={(order) => {
          if (order.status === 'pending') {
            const orderItem = allItemsData?.find(
              ({ publicKey }) => publicKey === order.item
            );

            if (!orderItem) {
              throw new Error('Matching item not found for order.');
            }

            const orderShopper = allShoppersData?.find(
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
