'use client';

import { CreateSection } from '@/components/CreateSection';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';
import { useStore } from '@/providers/StoreProvider';

export default function Page() {
  const router = useRouter();
  const { personalStore } = useStore();

  if (personalStore.isLoading) {
    return <Spinner />;
  } else if (personalStore.data) {
    router.replace(`/stores/${personalStore.data.publicKey}`);
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
