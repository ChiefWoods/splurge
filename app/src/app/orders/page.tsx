'use client';

import { getShopperPda } from '@/lib/pda';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { NoResultText } from '@/components/NoResultText';
import { OrderTable } from '@/components/OrderTable';
import { OrderTableRow } from '@/components/OrderTableRow';

export default function Page() {
  const { publicKey } = useWallet();
  const { allOrders } = useOrder();
  const { allItems } = useItem();

  useEffect(() => {
    if (!publicKey) return;

    (async () => {
      await allOrders.trigger({
        shopperPda: getShopperPda(publicKey).toBase58(),
      });
      await allItems.trigger({});
    })();
  }, [publicKey]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">My Orders</h2>
      {publicKey ? (
        <OrderTable
          allItems={allItems}
          allOrders={allOrders}
          isFetching={allOrders.isMutating || allItems.isMutating}
          sortedOrdersMapper={({
            amount,
            item,
            paymentMint,
            paymentSubtotal,
            platformFee,
            publicKey: orderPda,
            status,
            timestamp,
          }) => {
            const orderItem = allItems.data?.find(
              ({ publicKey }) => publicKey === item
            );

            if (!orderItem) {
              throw new Error('Matching item not found for order.');
            }

            return (
              <OrderTableRow
                key={orderPda}
                amount={amount}
                firstCell={
                  // @ts-expect-error status is a DecodeEnum but is actually a string
                  <StatusBadge status={status} />
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
          showTotalTooltip={true}
        />
      ) : (
        <NoResultText text="Connect your wallet to view your orders." />
      )}
    </section>
  );
}
