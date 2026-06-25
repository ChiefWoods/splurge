import { PublicKey } from "@solana/web3.js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { fetchItem } from "@/lib/accounts";
import { isPublicKey } from "@/lib/client/solana";
import { CONNECTION } from "@/lib/server/solana";
import { ItemProvider } from "@/providers/ItemProvider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemPda: string }>;
}): Promise<Metadata> {
  const { itemPda } = await params;

  // validate PDA
  try {
    new PublicKey(itemPda);
  } catch {
    return {
      title: "404",
    };
  }

  const item = await fetchItem(CONNECTION, itemPda);

  if (!item) {
    return {
      title: "404",
    };
  }

  return {
    title: item.data.name,
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ itemPda: string }>;
}) {
  const { itemPda } = await params;

  if (!isPublicKey(itemPda)) {
    notFound();
  }

  const item = await fetchItem(CONNECTION, itemPda);

  // 404 if item doesn't exist
  if (!item) {
    notFound();
  }

  return <ItemProvider fallbackData={item}>{children}</ItemProvider>;
}
