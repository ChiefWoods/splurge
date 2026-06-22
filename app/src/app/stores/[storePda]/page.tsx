import { PublicKey } from "@solana/web3.js";
import { notFound } from "next/navigation";

import { StoreAccountSection } from "@/components/StoreAccountSection";
import { StoreSection } from "@/components/StoreSection";
import { Separator } from "@/components/ui/separator";
import { fetchConfig, fetchStore } from "@/lib/accounts";
import { SPLURGE_CLIENT } from "@/lib/server/solana";

export default async function Page({ params }: { params: Promise<{ storePda: string }> }) {
  const { storePda } = await params;

  // 404 if PDA is not a valid public key
  try {
    new PublicKey(storePda);
  } catch {
    notFound();
  }

  const [store, config] = await Promise.all([
    fetchStore(SPLURGE_CLIENT, storePda),
    fetchConfig(SPLURGE_CLIENT),
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
