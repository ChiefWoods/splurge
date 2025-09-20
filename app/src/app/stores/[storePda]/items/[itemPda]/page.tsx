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
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ShoppingCart } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const { storePda, itemPda } = useParams<{
    storePda: string;
    itemPda: string;
  }>();
  const { publicKey } = useUnifiedWallet();
  const [reviewOrderPda, setReviewOrderPda] = useState<string>('');
  const { itemData, itemIsMutating, itemTrigger } = useItem();
  const { storeData, storeIsMutating, storeTrigger } = useStore();
  const { allOrdersData, allOrdersIsMutating, allOrdersTrigger } = useOrder();
  const { allReviewsData, allReviewsIsMutating, allReviewsTrigger } =
    useReview();
  const { allShoppersData, allShoppersIsMutating, allShoppersTrigger } =
    useShopper();

  useEffect(() => {
    (async () => {
      await itemTrigger({ publicKey: itemPda });
      await storeTrigger({ publicKey: storePda });
      await allOrdersTrigger({ storePda });
      await allReviewsTrigger({ itemPda });
      await allShoppersTrigger();

      if ((!itemIsMutating && !itemData) || (!storeIsMutating && !storeData)) {
        notFound();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, storePda, itemPda]);

  useEffect(() => {
    if (publicKey && allOrdersData && allReviewsData) {
      const completedShopperOrders = allOrdersData.filter(
        (order) =>
          order.item === itemPda &&
          order.shopper === getShopperPda(publicKey).toBase58() &&
          order.status === 'completed'
      );

      for (const order of completedShopperOrders) {
        if (
          !allReviewsData.find((review) => review.order === order.publicKey)
        ) {
          setReviewOrderPda(order.publicKey);
          return;
        }
      }
    }

    setReviewOrderPda('');
  }, [publicKey, itemPda, allOrdersData, allReviewsData]);

  return (
    <section className="main-section flex-1">
      {itemIsMutating ? (
        <AccountSectionSkeleton />
      ) : (
        itemData &&
        storeData && (
          <AccountSection
            key={itemData.publicKey}
            title={itemData.name}
            image={itemData.image}
            prefix="Item ID:"
            address={storePda}
            content={
              <>
                <p className="truncate text-primary">{itemData.description}</p>
                <p className="font-semibold text-primary">
                  {atomicToUsd(itemData.price)} USD
                </p>
                <p className="muted-text">
                  {itemData.inventoryCount} in inventory
                </p>
              </>
            }
            buttons={
              publicKey &&
              getStorePda(publicKey).toBase58() !== storePda &&
              itemData.inventoryCount > 0 && (
                <AccountSectionButtonTab>
                  <CheckoutDialog
                    name={itemData.name}
                    image={itemData.image}
                    price={itemData.price}
                    maxAmount={itemData.inventoryCount}
                    storePda={storePda}
                    storeAuthority={storeData.authority}
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
          {itemData && reviewOrderPda && (
            <AddReviewDialog itemPda={itemPda} orderPda={reviewOrderPda} />
          )}
        </div>
        <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
          {allOrdersIsMutating ||
          allShoppersIsMutating ||
          allReviewsIsMutating ||
          storeIsMutating ||
          itemIsMutating ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </>
          ) : allOrdersData && allShoppersData && allReviewsData?.length ? (
            allReviewsData.map(
              ({ publicKey, order, rating, timestamp, text }) => {
                const reviewOrder = allOrdersData?.find(
                  ({ publicKey }) => publicKey === order
                );

                if (!reviewOrder) {
                  throw new Error('Matching order not found for review.');
                }

                const shopper = allShoppersData?.find(
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
