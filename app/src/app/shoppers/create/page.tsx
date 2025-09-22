'use client';

import { CreateSection } from '@/components/CreateSection';
import { Spinner } from '@/components/Spinner';
import { CreateProfileDialog } from '@/components/formDialogs/CreateProfileDialog';
import { useShopper } from '@/providers/ShopperProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const { shopperData, shopperLoading } = useShopper();

  useEffect(() => {
    if (shopperData) {
      router.replace(`/shoppers/${shopperData.publicKey}`);
    }
  }, [shopperData, router]);

  if (shopperLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Shopper profile to start splurging!">
      <CreateProfileDialog />
    </CreateSection>
  );
}
