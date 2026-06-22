"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { Wallet } from "lucide-react";

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

export function ConnectWalletEmpty() {
  const { connecting } = useUnifiedWallet();

  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-primary-foreground bg-primary">
          <Wallet />
        </EmptyMedia>
        <EmptyTitle>{connecting ? "Connecting..." : "Connect Wallet"}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
