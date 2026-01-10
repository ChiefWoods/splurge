'use client';

import { useMemo } from 'react';
import { SectionHeader } from './SectionHeader';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ParsedOrder, ParsedReview, ParsedShopper } from '@/types/accounts';
import { AddReviewDialog } from './formDialogs/AddReviewDialog';
import { EmptyResult } from './EmptyResult';
import { UserStar } from 'lucide-react';
import { ReviewRow } from './ReviewRow';
import { SplurgeClient } from '@/classes/SplurgeClient';

export function ItemReviewSection({
  itemPda,
  orders,
  shoppers,
  reviews,
}: {
  itemPda: string;
  orders: ParsedOrder[];
  shoppers: ParsedShopper[];
  reviews: ParsedReview[];
}) {
  const { publicKey } = useUnifiedWallet();

  const reviewOrderPda = useMemo(() => {
    if (!publicKey) return null;

    const completedShopperOrders = orders.filter(
      (order) =>
        order.item === itemPda &&
        order.shopper === SplurgeClient.getShopperPda(publicKey).toBase58() &&
        order.status === 'completed'
    );

    for (const order of completedShopperOrders) {
      if (!reviews.find((review) => review.order === order.publicKey)) {
        return order.publicKey;
      }
    }

    return null;
  }, [publicKey, itemPda, orders, reviews]);

  return (
    <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-3 md:gap-6">
      <div className="flex w-full items-center justify-between">
        <SectionHeader text="Reviews" />
        {reviewOrderPda && <AddReviewDialog orderPda={reviewOrderPda} />}
      </div>
      <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const reviewOrder = orders.find(
              ({ publicKey }) => publicKey === review.order
            );

            if (!reviewOrder) {
              throw new Error('Matching order not found for review.');
            }

            const shopper = shoppers.find(
              (shopper) => shopper.publicKey === reviewOrder.shopper
            );

            if (!shopper) {
              throw new Error('Matching shopper not found for order.');
            }

            return (
              <ReviewRow
                key={review.publicKey}
                review={review}
                shopper={shopper}
              />
            );
          })
        ) : (
          <EmptyResult Icon={UserStar} text="No reviews made." />
        )}
      </ul>
    </section>
  );
}
