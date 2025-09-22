'use client';

import { getStorePda } from '@/lib/pda';
import { useStore } from '@/providers/StoreProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useParams, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { storePda } = useParams<{ storePda: string }>();
  const router = useRouter();
  const { publicKey } = useUnifiedWallet();
  const { storeData, storeLoading } = useStore();

  useEffect(() => {
    if (!publicKey) {
      router.replace('/');
    } else if (getStorePda(publicKey).toBase58() !== storePda) {
      router.replace('/');
    } else if (!storeLoading && !storeData) {
      router.replace('/stores/create');
    }
  }, [router, publicKey, storePda, storeData, storeLoading]);

  return <>{children}</>;
}
