'use client';

import { CreateSection } from '@/components/CreateSection';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';
import { useStore } from '@/providers/StoreProvider';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const { personalStore } = useStore();

  useEffect(() => {
    if (personalStore.data) {
      router.replace(`/stores/${personalStore.data.publicKey}`);
    }
  }, [personalStore.data, router]);

  if (personalStore.isLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
