import { notFound } from "next/navigation";

import { ShopperAccountSection } from "@/components/ShopperAccountSection";
import { fetchShopper } from "@/lib/accounts";
import { isPublicKey } from "@/lib/client/solana";
import { CONNECTION } from "@/lib/server/solana";

export default async function Page({ params }: { params: Promise<{ shopperPda: string }> }) {
  const { shopperPda } = await params;

  if (!isPublicKey(shopperPda)) {
    notFound();
  }

  const shopper = await fetchShopper(CONNECTION, shopperPda);

  // 404 if shopper doesn't exist
  if (!shopper) {
    notFound();
  }

  return <ShopperAccountSection shopper={shopper} />;
}
