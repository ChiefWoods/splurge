import { MyOrdersSection } from '@/components/MyOrdersSection';
import { fetchAllItems } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';

export default async function Page() {
  const items = await fetchAllItems(SPLURGE_CLIENT);

  return <MyOrdersSection items={items} />;
}
