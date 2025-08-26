'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionButtonTab } from '@/components/AccountSectionButtonTab';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { AddReviewDialog } from '@/components/formDialogs/AddReviewDialog';
import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { NoResultText } from '@/components/NoResultText';
import { ReviewRow } from '@/components/ReviewRow';
import { ReviewRowSkeleton } from '@/components/ReviewRowSkeleton';
import { Separator } from '@/components/ui/separator';
import { getShopperPda, getStorePda } from '@/lib/pda';
import { atomicToUsd } from '@/lib/utils';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useReview } from '@/providers/ReviewProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { ShoppingCart } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const { storePda, itemPda } = useParams<{
    storePda: string;
    itemPda: string;
  }>();
  const { publicKey } = useWallet();
  const [reviewOrderPda, setReviewOrderPda] = useState<string>('');
  const { item } = useItem();
  const { store } = useStore();
  const { allOrders } = useOrder();
  const { allReviews } = useReview();
  const { allShoppers } = useShopper();

  useEffect(() => {
    (async () => {
      await item.trigger({ publicKey: itemPda });
      await store.trigger({ publicKey: storePda });
      await allOrders.trigger({
        storePda,
        shopperPda: publicKey ? getShopperPda(publicKey).toBase58() : undefined,
      });
      await allReviews.trigger({ itemPda });
      await allShoppers.trigger();

      if (
        (!item.isMutating && !item.data) ||
        (!store.isMutating && !store.data)
      ) {
        notFound();
      }
    })();
  }, [publicKey, storePda, itemPda]);

  useEffect(() => {
    if (publicKey && allOrders.data?.length && allReviews.data?.length) {
      const itemOrders = allOrders.data.filter(
        (order) => order.item === itemPda
      );

      for (const order of itemOrders) {
        if (
          !allReviews.data.find((review) => review.order === order.publicKey)
        ) {
          setReviewOrderPda(order.publicKey);
          return;
        }
      }
    }

    setReviewOrderPda('');
  }, [publicKey, itemPda, allOrders, allReviews]);

  return (
    <section className="main-section flex-1">
      {item.isMutating ? (
        <AccountSectionSkeleton />
      ) : (
        item.data && (
          <AccountSection
            key={item.data.publicKey}
            title={item.data.name}
            image={item.data.image}
            prefix="Item ID:"
            address={storePda}
            content={
              <>
                <p className="truncate text-primary">{item.data.description}</p>
                <p className="font-semibold text-primary">
                  {atomicToUsd(item.data.price)} USD
                </p>
                <p className="muted-text">
                  {item.data.inventoryCount} in inventory
                </p>
              </>
            }
            buttons={
              publicKey &&
              getStorePda(publicKey).toBase58() === storePda &&
              item.data.inventoryCount > 0 && (
                <AccountSectionButtonTab>
                  <CheckoutDialog
                    name={item.data.name}
                    image={item.data.image}
                    price={item.data.price}
                    maxAmount={item.data.inventoryCount}
                    storePda={storePda}
                    itemPda={itemPda}
                  >
                    <ShoppingCart />
                    Buy
                  </CheckoutDialog>
                </AccountSectionButtonTab>
              )
            }
          />
        )
      )}
      <Separator />
      <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-y-8">
        <div className="flex w-full items-center justify-between">
          <h2>Reviews</h2>
          {item && reviewOrderPda && (
            <AddReviewDialog itemPda={itemPda} orderPda={reviewOrderPda} />
          )}
        </div>
        <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
          {allOrders.isMutating ||
          allShoppers.isMutating ||
          allReviews.isMutating ||
          store.isMutating ||
          item.isMutating ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </>
          ) : allOrders.data && allShoppers.data && allReviews.data?.length ? (
            allReviews.data.map(
              ({ publicKey, order, rating, timestamp, text }) => {
                const reviewOrder = allOrders.data?.find(
                  ({ publicKey }) => publicKey === order
                );

                if (!reviewOrder) {
                  throw new Error('Matching order not found for review.');
                }

                const shopper = allShoppers.data?.find(
                  (shopper) => shopper.publicKey === reviewOrder.shopper
                );

                if (!shopper) {
                  throw new Error('Matching shopper not found for order.');
                }

                return (
                  <ReviewRow
                    key={publicKey}
                    shopperPda={shopper.publicKey}
                    shopperName={shopper.name}
                    shopperImage={shopper.image}
                    timestamp={timestamp}
                    rating={rating}
                    text={text}
                  />
                );
              }
            )
          ) : (
            <NoResultText text="No reviews made." />
          )}
        </ul>
      </section>
    </section>
  );
}
