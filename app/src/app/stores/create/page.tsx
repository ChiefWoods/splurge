'use client';

import { CreateSection } from '@/components/CreateSection';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';
import { useStore } from '@/providers/StoreProvider';

export default function Page() {
  const router = useRouter();
  const { store, storeMutating } = useStore();

  if (storeMutating) {
    return <Spinner />;
  } else if (!storeMutating && store) {
    router.replace(`/stores/${store}`);
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
