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
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getStorePda } from '@/lib/pda';
import { Review } from '@/types/idlAccounts';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ShoppingCart } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import useSWR from 'swr';

interface ReviewShopper {
  shopperPda: string;
  shopperName: string;
  shopperImage: string;
}

export default function Page() {
  const { storePda, storeItemPda } = useParams<{
    storePda: string;
    storeItemPda: string;
  }>();
  const { publicKey } = useWallet();
  const {
    getShopperAcc,
    getStoreItemAcc,
    getMultipleShopperAcc,
    getMultipleOrderAcc,
    getMultipleReviewAcc,
  } = useAnchorProgram();

  const storeItem = useSWR(
    { url: `/api/stores/${storePda}/items/${storeItemPda}`, publicKey },
    async ({ publicKey }) => {
      const storeItemAcc = await getStoreItemAcc(new PublicKey(storeItemPda));

      let isOwner = false;
      let canAddReview = false;
      let shopperReviews: (Review & { reviewPda: string } & ReviewShopper)[] =
        [];
      let reviewOrderPda: string = '';

      if (storeItemAcc) {
        if (publicKey) {
          isOwner = getStorePda(publicKey).toBase58() === storePda;

          if (!isOwner) {
            const reviews = (
              await getMultipleReviewAcc(storeItemAcc.reviews)
            ).filter((item) => item !== null);

            const orders = (
              await getMultipleOrderAcc(reviews.map((review) => review.order))
            ).filter((item) => item !== null);

            const shoppers = (
              await getMultipleShopperAcc(orders.map((order) => order.shopper))
            ).filter((item) => item !== null);

            shopperReviews = reviews.map((review: Review, i) => {
              return {
                ...review,
                reviewPda: storeItemAcc.reviews[i].toBase58(),
                orderPda: reviews[i].order.toBase58(),
                shopperPda: orders[i].shopper.toBase58(),
                shopperName: shoppers[i].name,
                shopperImage: shoppers[i].image,
              };
            });

            const walletShopperAcc = await getShopperAcc(publicKey);

            if (walletShopperAcc) {
              const orderSet = new Set(
                walletShopperAcc.orders.map((order) => order.toBase58())
              );

              for (const review of shopperReviews) {
                if (!orderSet.has(review.order.toBase58())) {
                  canAddReview = true;
                  reviewOrderPda = review.order.toBase58();
                  break;
                }
              }
            }
          }
        }
      }

      return {
        acc: storeItemAcc,
        reviews: shopperReviews,
        isOwner,
        canAddReview,
        reviewOrderPda,
      };
    }
  );

  if (storeItem.data && !storeItem.data.acc) {
    notFound();
  }

  return (
    <section className="main-section flex-1">
      {storeItem.isLoading ? (
        <AccountSectionSkeleton />
      ) : (
        storeItem.data &&
        storeItem.data.acc && (
          <AccountSection
            key={storeItemPda}
            title={storeItem.data.acc.name}
            image={storeItem.data.acc.image}
            prefix="Item ID:"
            address={storePda}
            content={
              <>
                <p className="truncate text-primary">
                  {storeItem.data.acc.description}
                </p>
                <p className="font-semibold text-primary">
                  {storeItem.data.acc.price.toFixed(2)} USD
                </p>
                <p className="muted-text">
                  {storeItem.data.acc.inventoryCount.toNumber()} left
                </p>
              </>
            }
            buttons={
              !storeItem.data.isOwner &&
              storeItem.data.acc.inventoryCount.toNumber() > 0 && (
                <AccountSectionButtonTab>
                  <CheckoutDialog
                    name={storeItem.data.acc.name}
                    image={storeItem.data.acc.image}
                    price={storeItem.data.acc.price}
                    maxAmount={storeItem.data.acc.inventoryCount.toNumber()}
                    storePda={storePda}
                    storeItemPda={storeItemPda}
                    mutate={storeItem.mutate}
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
          {storeItem.data &&
            storeItem.data.canAddReview &&
            storeItem.data.reviewOrderPda && (
              <AddReviewDialog
                storeItemPda={storeItemPda}
                orderPda={storeItem.data.reviewOrderPda}
                mutate={storeItem.mutate}
              />
            )}
        </div>
        <ul className="flex w-full flex-1 flex-col flex-wrap gap-6">
          {storeItem.isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </>
          ) : storeItem.data && storeItem.data.reviews.length ? (
            storeItem.data.reviews.map(
              ({
                reviewPda,
                shopperPda,
                shopperName,
                shopperImage,
                timestamp,
                rating,
                text,
              }) =>
                storeItem.data && (
                  <ReviewRow
                    key={reviewPda}
                    shopperPda={shopperPda}
                    shopperName={shopperName}
                    shopperImage={shopperImage}
                    timestamp={timestamp.toNumber()}
                    rating={rating}
                    text={text}
                  />
                )
            )
          ) : (
            <NoResultText text="No Reviews Made." />
          )}
        </ul>
      </section>
    </section>
  );
}
