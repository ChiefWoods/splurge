import { MyOrdersSection } from "@/components/MyOrdersSection";
import { fetchAllItems } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export default async function Page() {
  const items = await fetchAllItems(CONNECTION);

  return <MyOrdersSection items={items} />;
}
