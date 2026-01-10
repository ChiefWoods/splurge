'use client';

import { ConnectWalletEmpty } from '@/components/ConnectWalletEmpty';
import { WrappedSpinner } from '@/components/WrappedSpinner';
import { wrappedFetch } from '@/lib/api';
import { ParsedStore } from '@/types/accounts';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { forbidden, useParams } from 'next/navigation';
import { ReactNode } from 'react';
import useSWR from 'swr';

export default function Layout({ children }: { children: ReactNode }) {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useUnifiedWallet();

  // fetch store to check if authority matches wallet
  const { data: storeData, isLoading: storeLoading } = useSWR(
    storePda,
    async (storePda) => {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/stores`
      );

      url.searchParams.append('pda', storePda);

      const store = (await wrappedFetch(url.href)).store as ParsedStore;

      return store;
    }
  );

  if (!publicKey) {
    return <ConnectWalletEmpty />;
  }

  if (storeLoading) {
    return <WrappedSpinner />;
  }

  if (storeData && storeData.authority !== publicKey.toBase58()) {
    forbidden();
  }

  return children;
}
