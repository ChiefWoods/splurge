"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { findShopperPda } from "@splurge/sdk";
import { UserStar } from "lucide-react";
import { useMemo } from "react";

import { ParsedOrder, ParsedReview, ParsedShopper } from "@/types/accounts";

import { EmptyResult } from "./EmptyResult";
import { AddReviewDialog } from "./formDialogs/AddReviewDialog";
import { ReviewRow } from "./ReviewRow";
import { SectionHeader } from "./SectionHeader";

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

    const shopperPda = findShopperPda({ authority: publicKey })[0].toBase58();
    const reviewedOrderAddresses = new Set(reviews.map((review) => review.data.order));

    for (const order of orders) {
      if (
        order.data.item === itemPda &&
        order.data.shopper === shopperPda &&
        order.data.status === "completed" &&
        !reviewedOrderAddresses.has(order.address)
      ) {
        return order.address;
      }
    }

    return null;
  }, [publicKey, itemPda, orders, reviews]);

  const reviewRows = useMemo(() => {
    const orderByAddress = new Map(orders.map((order) => [order.address, order]));
    const shopperByAddress = new Map(shoppers.map((shopper) => [shopper.address, shopper]));

    return reviews.map((review) => {
      const reviewOrder = orderByAddress.get(review.data.order);

      if (!reviewOrder) {
        throw new Error("Matching order not found for review.");
      }

      const shopper = shopperByAddress.get(reviewOrder.data.shopper);

      if (!shopper) {
        throw new Error("Matching shopper not found for order.");
      }

      return <ReviewRow key={review.address} review={review} shopper={shopper} />;
    });
  }, [orders, shoppers, reviews]);

  return (
    <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-3 md:gap-6">
      <div className="flex w-full items-center justify-between">
        <SectionHeader text="Reviews" />
        {reviewOrderPda && <AddReviewDialog orderPda={reviewOrderPda} />}
      </div>
      <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
        {reviews.length > 0 ? (
          reviewRows
        ) : (
          <EmptyResult Icon={UserStar} text="No reviews made." />
        )}
      </ul>
    </section>
  );
}
