'use client';

import { CreateSection } from '@/components/CreateSection';
import { Spinner } from '@/components/Spinner';
import { CreateProfileDialog } from '@/components/formDialogs/CreateProfileDialog';
import { useShopper } from '@/providers/ShopperProvider';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const { shopper } = useShopper();

  if (shopper.isLoading) {
    return <Spinner />;
  } else if (shopper.data) {
    router.replace(`/shoppers/${shopper.data.publicKey}`);
  }

  return (
    <CreateSection header="Create your Shopper profile to start splurging!">
      <CreateProfileDialog />
    </CreateSection>
  );
}
