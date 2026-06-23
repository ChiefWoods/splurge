import { CommonMain } from "@/components/CommonMain";
import { LandingFeaturedSection } from "@/components/LandingFeaturedSection";
import { fetchAllItems, fetchAllStores, fetchConfig } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";
import { ItemsProvider } from "@/providers/ItemsProvider";

export default async function Page() {
  const [items, stores, config] = await Promise.all([
    fetchAllItems(CONNECTION),
    fetchAllStores(CONNECTION),
    fetchConfig(CONNECTION),
  ]);

  if (!config) {
    throw new Error("Config not initialized.");
  }

  return (
    <CommonMain>
      <ItemsProvider fallbackData={items}>
        <LandingFeaturedSection items={items} stores={stores} config={config} />
      </ItemsProvider>
    </CommonMain>
  );
}
