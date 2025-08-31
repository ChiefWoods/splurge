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
  const { allOrdersData, allOrdersIsMutating, allOrdersTrigger } = useOrder();
  const { allItemsData, allItemsIsMutating, allItemsTrigger } = useItem();

  useEffect(() => {
    if (!publicKey) return;

    (async () => {
      await allOrdersTrigger({
        shopperPda: getShopperPda(publicKey).toBase58(),
      });
      await allItemsTrigger({});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">My Orders</h2>
      {publicKey ? (
        <OrderTable
          allItemsData={allItemsData}
          allOrdersData={allOrdersData}
          isFetching={allOrdersIsMutating || allItemsIsMutating}
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
            const orderItem = allItemsData?.find(
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
