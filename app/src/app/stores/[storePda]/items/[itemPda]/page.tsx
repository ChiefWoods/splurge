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
  const { item, itemMutating, triggerItem } = useItem();
  const { store, storeMutating, triggerStore } = useStore();
  const { allOrders, allOrdersMutating, triggerAllOrders } = useOrder();
  const { allReviews, allReviewsMutating, triggerAllReviews } = useReview();
  const { allShoppers, allShoppersMutating, triggerAllShoppers } = useShopper();

  triggerItem({ publicKey: itemPda });
  triggerStore({ publicKey: storePda });
  triggerAllOrders({
    storePda,
    shopperPda: publicKey ? getShopperPda(publicKey).toBase58() : undefined,
  });
  triggerAllReviews({ itemPda });
  triggerAllShoppers();

  if ((!itemMutating && !item) || (!storeMutating && !store)) {
    notFound();
  }

  useEffect(() => {
    if (publicKey && allOrders?.length && allReviews?.length) {
      const itemOrders = allOrders.filter((order) => order.item === itemPda);

      for (const order of itemOrders) {
        if (!allReviews.find((review) => review.order === order.publicKey)) {
          setReviewOrderPda(order.publicKey);
          return;
        }
      }
    }

    setReviewOrderPda('');
  }, [publicKey, itemPda, allOrders, allReviews]);

  return (
    <section className="main-section flex-1">
      {itemMutating ? (
        <AccountSectionSkeleton />
      ) : (
        item && (
          <AccountSection
            key={item.publicKey}
            title={item.name}
            image={item.image}
            prefix="Item ID:"
            address={storePda}
            content={
              <>
                <p className="truncate text-primary">{item.description}</p>
                <p className="font-semibold text-primary">
                  {item.price.toFixed(2)} USD
                </p>
                <p className="muted-text">{item.inventoryCount} left</p>
              </>
            }
            buttons={
              publicKey &&
              getStorePda(publicKey).toBase58() === storePda &&
              item.inventoryCount > 0 && (
                <AccountSectionButtonTab>
                  <CheckoutDialog
                    name={item.name}
                    image={item.image}
                    price={item.price}
                    maxAmount={item.inventoryCount}
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
          {allOrdersMutating || allShoppersMutating || allReviewsMutating ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </>
          ) : allOrders && allShoppers && allReviews?.length ? (
            allReviews.map(({ publicKey, order, rating, timestamp, text }) => {
              const reviewOrder = allOrders.find(
                ({ publicKey }) => publicKey === order
              );

              if (!reviewOrder) {
                throw new Error('Matching order not found for review.');
              }

              const shopper = allShoppers.find(
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
            })
          ) : (
            <NoResultText text="No reviews made." />
          )}
        </ul>
      </section>
    </section>
  );
}
