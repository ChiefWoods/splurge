'use client';

import { getShopperPda } from '@/lib/pda';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { NoResultText } from '@/components/NoResultText';
import { OrderTable } from '@/components/OrderTable';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

export default function Page() {
  const { publicKey } = useUnifiedWallet();
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
          // @ts-expect-error status is a DecodeEnum but is actually a string
          statusRenderer={(order) => <StatusBadge status={order.status} />}
          showTotalTooltip={true}
        />
      ) : (
        <NoResultText text="Connect your wallet to view your orders." />
      )}
    </section>
  );
}
