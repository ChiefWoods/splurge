import { PublicKey } from "@solana/web3.js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { fetchAllItems, fetchStore } from "@/lib/accounts";
import { isPublicKey } from "@/lib/client/solana";
import { CONNECTION } from "@/lib/server/solana";
import { ItemsProvider } from "@/providers/ItemsProvider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storePda: string }>;
}): Promise<Metadata> {
  const { storePda } = await params;

  // validate PDA
  try {
    new PublicKey(storePda);
  } catch {
    return {
      title: "404",
    };
  }

  const store = await fetchStore(CONNECTION, storePda);

  if (!store) {
    return {
      title: "404",
    };
  }

  return {
    title: {
      default: store.data.name,
      template: "%s | Splurge",
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  if (!isPublicKey(storePda)) {
    notFound();
  }

  const items = await fetchAllItems(CONNECTION, { store: storePda });

  return (
    <ItemsProvider fallbackData={items} store={storePda}>
      {children}
    </ItemsProvider>
  );
}
