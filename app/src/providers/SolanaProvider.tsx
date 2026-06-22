"use client";

import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { ReactNode } from "react";
import { toast } from "sonner";

import { CLUSTER } from "@/lib/client/solana";

import { useSettings } from "./SettingsProvider";

const metadata = {
  name: "Splurge",
  description: "On-chain e-commerce platform",
  url: process.env.NEXT_PUBLIC_FRONTEND_BASE_URL as string,
  iconUrls: [`${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/favicon.ico`],
};

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { rpcType, customRpcUrl } = useSettings();

  const defaultEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER);

  return (
    <ConnectionProvider
      endpoint={
        rpcType === "default"
          ? defaultEndpoint
          : customRpcUrl !== ""
            ? customRpcUrl
            : defaultEndpoint
      }
    >
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: CLUSTER,
          metadata,
          notificationCallback: {
            onConnect: (props) => {
              toast.success(`Connected to wallet ${props.shortAddress}`);
            },
            onConnecting: (props) => {
              toast.message(`Connecting to ${props.walletName}`);
            },
            onDisconnect: (props) => {
              toast.message(`Disconnected from wallet ${props.shortAddress}`);
            },
            onNotInstalled: (props) => {
              toast.error(
                `${props.walletName} Wallet is not installed. Please go to the provider website to download.`,
              );
            },
          },
          walletlistExplanation: {
            href: "https://station.jup.ag/docs/old/additional-topics/wallet-list",
          },
          theme: "jupiter",
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}
