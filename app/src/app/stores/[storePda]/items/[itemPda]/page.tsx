'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionButtonTab } from '@/components/AccountSectionButtonTab';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { AddReviewDialog } from '@/components/formDialogs/AddReviewDialog';
import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { MainSection } from '@/components/MainSection';
import { NoResultText } from '@/components/NoResultText';
import { ReviewRow } from '@/components/ReviewRow';
import { ReviewRowSkeleton } from '@/components/ReviewRowSkeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { Separator } from '@/components/ui/separator';
import { atomicToUsd } from '@/lib/utils';
import { useItem } from '@/providers/ItemProvider';
import { useOrders } from '@/providers/OrdersProvider';
import { useProgram } from '@/providers/ProgramProvider';
import { useReviews } from '@/providers/ReviewsProvider';
import { useShoppers } from '@/providers/ShoppersProvider';
import { useStore } from '@/providers/StoreProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ShoppingCart } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function Page() {
  const { storePda, itemPda } = useParams<{
    storePda: string;
    itemPda: string;
  }>();
  const { publicKey } = useUnifiedWallet();
  const { splurgeClient } = useProgram();
  const { itemData, itemLoading } = useItem();
  const { storeData, storeLoading } = useStore();
  const { ordersData, ordersLoading } = useOrders();
  const { reviewsData, reviewsLoading } = useReviews();
  const { shoppersData, shoppersLoading } = useShoppers();

  useEffect(() => {
    (async () => {
      if ((!itemLoading && !itemData) || (!storeLoading && !storeData)) {
        notFound();
      }
    })();
  }, [itemLoading, itemData, storeLoading, storeData]);

  const reviewOrderPda = useMemo(() => {
    if (!publicKey || !ordersData || !reviewsData) return '';

    const completedShopperOrders = ordersData.filter(
      (order) =>
        order.item === itemPda &&
        order.shopper === splurgeClient.getShopperPda(publicKey).toBase58() &&
        order.status === 'completed'
    );

    for (const order of completedShopperOrders) {
      if (!reviewsData.find((review) => review.order === order.publicKey)) {
        return order.publicKey;
      }
    }

    return '';
  }, [publicKey, itemPda, ordersData, reviewsData, splurgeClient]);

  return (
    <MainSection className="flex-1">
      {itemLoading ? (
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
                <p>{itemData.description}</p>
                <p className="font-semibold">
                  {atomicToUsd(itemData.price)} USD
                </p>
                <p>{itemData.inventoryCount} in inventory</p>
              </>
            }
            buttons={
              publicKey &&
              splurgeClient.getStorePda(publicKey).toBase58() !== storePda &&
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
      <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-6">
        <div className="flex w-full items-center justify-between">
          <SectionHeader text="Reviews" />
          {itemData && reviewOrderPda && (
            <AddReviewDialog orderPda={reviewOrderPda} />
          )}
        </div>
        <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
          {ordersLoading ||
          shoppersLoading ||
          reviewsLoading ||
          storeLoading ||
          itemLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </>
          ) : ordersData && shoppersData && reviewsData?.length ? (
            reviewsData.map(({ publicKey, order, rating, timestamp, text }) => {
              const reviewOrder = ordersData?.find(
                ({ publicKey }) => publicKey === order
              );

              if (!reviewOrder) {
                throw new Error('Matching order not found for review.');
              }

              const shopper = shoppersData?.find(
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
    </MainSection>
  );
}
