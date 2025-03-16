'use client';

import { CreateSection } from '@/components/CreateSection';
import { Spinner } from '@/components/Spinner';
import { CreateProfileDialog } from '@/components/formDialogs/CreateProfileDialog';
import { useShopper } from '@/providers/ShopperProvider';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const { shopper, shopperLoading } = useShopper();

  if (shopperLoading) {
    return <Spinner />;
  } else if (!shopperLoading && shopper) {
    router.replace(`/shoppers/${shopper}`);
  }

  return (
    <CreateSection header="Create your Shopper profile to start splurging!">
      <CreateProfileDialog />
    </CreateSection>
  );
}
