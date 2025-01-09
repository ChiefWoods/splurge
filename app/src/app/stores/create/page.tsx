'use client';

import { CreateSection } from '@/components/CreateSection';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import useSWR from 'swr';
import { getStorePda } from '@/lib/pda';
import { Spinner } from '@/components/Spinner';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';

export default function Page() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { getStoreAcc } = useAnchorProgram();

  const store = useSWR(
    publicKey ? { url: '/api/stores/create', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getStorePda(publicKey);
      const acc = await getStoreAcc(pda);

      if (acc) {
        router.replace(`/stores/${pda}`);
      }

      return { pda };
    }
  );

  if (store.isLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog store={store} />
    </CreateSection>
  );
}
