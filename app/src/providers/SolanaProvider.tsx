'use client';

import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { ReactNode, useMemo } from 'react';
import { CLUSTER, CONNECTION } from '@/lib/solana-client';
import { toast } from 'sonner';

const metadata = {
  name: 'Splurge',
  description: 'On-chain e-commerce platform',
  url: process.env.NEXT_PUBLIC_FRONTEND_BASE_URL as string,
  iconUrls: [`${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/favicon.ico`],
};

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => CONNECTION.rpcEndpoint, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={wallets}
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
                `${props.walletName} Wallet is not installed. Please go to the provider website to download.`
              );
            },
          },
          walletlistExplanation: {
            href: 'https://station.jup.ag/docs/old/additional-topics/wallet-list',
          },
          theme: 'jupiter',
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}
