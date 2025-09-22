'use client';

import { CreateSection } from '@/components/CreateSection';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';
import { useEffect } from 'react';
import { usePersonalStore } from '@/providers/PersonalStoreProvider';

export default function Page() {
  const router = useRouter();
  const { personalStoreData, personalStoreLoading } = usePersonalStore();

  useEffect(() => {
    if (personalStoreData) {
      router.replace(`/stores/${personalStoreData.publicKey}`);
    }
  }, [personalStoreData, router]);

  if (personalStoreLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
