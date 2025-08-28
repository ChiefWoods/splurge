'use client';

import { UpdateOrderDialog } from '@/components/formDialogs/UpdateOrderDialog';
import { OrderTable } from '@/components/OrderTable';
import { OrderTableRow } from '@/components/OrderTableRow';
import { StatusBadge } from '@/components/StatusBadge';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { allOrders } = useOrder();
  const { allItems } = useItem();
  const { allShoppers } = useShopper();

  useEffect(() => {
    (async () => {
      await allOrders.trigger({
        storePda,
      });
      await allItems.trigger({ storePda });
      await allShoppers.trigger();
    })();
  }, [storePda]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">Manage Orders</h2>
      <OrderTable
        allItems={allItems}
        allOrders={allOrders}
        sortedOrdersMapper={({
          amount,
          item,
          paymentMint,
          paymentSubtotal,
          platformFee,
          publicKey: orderPda,
          status,
          shopper,
          timestamp,
        }) => {
          const orderItem = allItems.data?.find(
            ({ publicKey }) => publicKey === item
          );

          if (!orderItem) {
            throw new Error('Matching item not found for order.');
          }

          const orderShopper = allShoppers.data?.find(
            ({ publicKey }) => publicKey === shopper
          );

          if (!orderShopper) {
            throw new Error('Matching shopper not found for order.');
          }

          return (
            <OrderTableRow
              key={orderPda}
              amount={amount}
              firstCell={
                <>
                  {/* @ts-expect-error status is a DecodeEnum but is actually a string */}
                  {status === 'pending' ? (
                    <UpdateOrderDialog
                      address={orderShopper.address}
                      amount={amount}
                      image={orderItem.image}
                      name={orderItem.name}
                      status={status}
                      orderPda={orderPda}
                    />
                  ) : (
                    // @ts-expect-error status is a DecodeEnum but is actually a string
                    <StatusBadge status={status} />
                  )}
                </>
              }
              itemImage={orderItem.image}
              itemName={orderItem.name}
              orderPda={orderPda}
              paymentMint={paymentMint}
              paymentSubtotal={paymentSubtotal}
              platformFee={platformFee}
              timestamp={timestamp}
            />
          );
        }}
      />
    </section>
  );
}
