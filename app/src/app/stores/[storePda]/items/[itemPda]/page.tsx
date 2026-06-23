import { notFound } from "next/navigation";

import { ItemAccountSection } from "@/components/ItemAccountSection";
import { ItemReviewSection } from "@/components/ItemReviewSection";
import { Separator } from "@/components/ui/separator";
import {
  fetchAllOrders,
  fetchAllReviews,
  fetchAllShoppers,
  fetchConfig,
  fetchItem,
  fetchStore,
} from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";
import { ReviewsProvider } from "@/providers/ReviewsProvider";

export default async function Page({
  params,
}: {
  params: Promise<{ storePda: string; itemPda: string }>;
}) {
  const { storePda, itemPda } = await params;

  const [orders, reviews, shoppers, store, item, config] = await Promise.all([
    fetchAllOrders(CONNECTION, { store: storePda }),
    fetchAllReviews(CONNECTION, { item: itemPda }),
    fetchAllShoppers(CONNECTION),
    fetchStore(CONNECTION, storePda),
    fetchItem(CONNECTION, itemPda),
    fetchConfig(CONNECTION),
  ]);

  // 404 if store doesn't exist
  if (!store) {
    notFound();
  }

  // 404 if item doesn't exist
  if (!item) {
    notFound();
  }

  if (!config) {
    throw new Error("Config not initialized.");
  }

  return (
    <>
      <ItemAccountSection store={store} item={item} config={config} />
      <Separator />
      <ReviewsProvider fallbackData={reviews} item={itemPda}>
        <ItemReviewSection
          itemPda={itemPda}
          orders={orders}
          shoppers={shoppers}
          reviews={reviews}
        />
      </ReviewsProvider>
    </>
  );
}
