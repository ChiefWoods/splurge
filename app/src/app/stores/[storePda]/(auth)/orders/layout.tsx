import { Metadata } from "next";
import { ReactNode } from "react";

import { fetchAllOrders } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";
import { OrdersProvider } from "@/providers/OrdersProvider";

export const metadata: Metadata = {
  title: "Store Orders",
};

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storePda: string }>;
}) {
  const { storePda } = await params;

  const orders = await fetchAllOrders(CONNECTION, { store: storePda });

  return (
    <OrdersProvider fallbackData={orders} store={storePda}>
      {children}
    </OrdersProvider>
  );
}
