'use client';

import dynamic from 'next/dynamic';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { ReactNode, useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';
import { CONNECTION } from '@/lib/constants';
import { toast } from 'sonner';

export const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  {
    ssr: false,
  }
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => CONNECTION.rpcEndpoint, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  function handleError(err: Error) {
    console.error(err);
    toast.error(err.message);
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={handleError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
