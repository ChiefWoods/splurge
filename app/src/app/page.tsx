import { LandingFeaturedSection } from '@/components/LandingFeaturedSection';
import { CommonMain } from '@/components/CommonMain';
import { fetchAllItems, fetchAllStores, fetchConfig } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { ItemsProvider } from '@/providers/ItemsProvider';

export default async function Page() {
  const [items, stores, config] = await Promise.all([
    fetchAllItems(SPLURGE_CLIENT),
    fetchAllStores(SPLURGE_CLIENT),
    fetchConfig(SPLURGE_CLIENT),
  ]);

  if (!config) {
    throw new Error('Config not initialized.');
  }

  return (
    <CommonMain>
      <ItemsProvider fallbackData={items}>
        <LandingFeaturedSection items={items} stores={stores} config={config} />
      </ItemsProvider>
    </CommonMain>
  );
}
