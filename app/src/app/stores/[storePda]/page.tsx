import { notFound } from "next/navigation";

import { StoreAccountSection } from "@/components/StoreAccountSection";
import { StoreSection } from "@/components/StoreSection";
import { Separator } from "@/components/ui/separator";
import { fetchConfig, fetchStore } from "@/lib/accounts";
import { isPublicKey } from "@/lib/client/solana";
import { CONNECTION } from "@/lib/server/solana";

export default async function Page({ params }: { params: Promise<{ storePda: string }> }) {
  const { storePda } = await params;

  if (!isPublicKey(storePda)) {
    notFound();
  }

  const [store, config] = await Promise.all([
    fetchStore(CONNECTION, storePda),
    fetchConfig(CONNECTION),
  ]);

  // 404 if store doesn't exist
  if (!store) {
    notFound();
  }

  if (!config) {
    throw new Error("Config not initialized.");
  }

  return (
    <>
      <StoreAccountSection store={store} />
      <Separator />
      <StoreSection store={store} config={config} />
    </>
  );
}
