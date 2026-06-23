import { ManageOrdersSection } from "@/components/ManageOrdersSection";
import { fetchAllItems, fetchAllOrders, fetchAllShoppers, fetchConfig } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export default async function Page({ params }: { params: Promise<{ storePda: string }> }) {
  const { storePda } = await params;

  const [orders, items, shoppers, config] = await Promise.all([
    fetchAllOrders(CONNECTION, { store: storePda }),
    fetchAllItems(CONNECTION, { store: storePda }),
    fetchAllShoppers(CONNECTION),
    fetchConfig(CONNECTION),
  ]);

  if (!config) {
    throw new Error("Config not initialized.");
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
