import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import {
  fetchAllOrders,
  fetchAllReviews,
  fetchAllShoppers,
  fetchConfig,
  fetchItem,
  fetchStore,
} from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { ItemAccountSection } from '@/components/ItemAccountSection';
import { ItemReviewSection } from '@/components/ItemReviewSection';
import { ReviewsProvider } from '@/providers/ReviewsProvider';

export default async function Page({
  params,
}: {
  params: Promise<{ storePda: string; itemPda: string }>;
}) {
  const { storePda, itemPda } = await params;

  const [orders, reviews, shoppers, store, item, config] = await Promise.all([
    fetchAllOrders(SPLURGE_CLIENT, { store: storePda }),
    fetchAllReviews(SPLURGE_CLIENT, { item: itemPda }),
    fetchAllShoppers(SPLURGE_CLIENT),
    fetchStore(SPLURGE_CLIENT, storePda),
    fetchItem(SPLURGE_CLIENT, itemPda),
    fetchConfig(SPLURGE_CLIENT),
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
    throw new Error('Config not initialized.');
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
