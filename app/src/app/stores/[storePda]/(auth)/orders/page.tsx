import { ManageOrdersSection } from '@/components/ManageOrdersSection';
import {
  fetchAllItems,
  fetchAllOrders,
  fetchAllShoppers,
  fetchConfig,
} from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';

export default async function Page({
  params,
}: {
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  const [orders, items, shoppers, config] = await Promise.all([
    fetchAllOrders(SPLURGE_CLIENT, { store: storePda }),
    fetchAllItems(SPLURGE_CLIENT, { store: storePda }),
    fetchAllShoppers(SPLURGE_CLIENT),
    fetchConfig(SPLURGE_CLIENT),
  ]);

  if (!config) {
    throw new Error('Config not initialized.');
  }

  return (
    <ManageOrdersSection
      config={config}
      items={items}
      orders={orders}
      shoppers={shoppers}
      storePda={storePda}
    />
  );
}
