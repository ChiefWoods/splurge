'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { MainSection } from '@/components/MainSection';
import { Button } from '@/components/ui/button';
import { useProgram } from '@/providers/ProgramProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { shopperPda } = useParams<{ shopperPda: string }>();
  const router = useRouter();
  const { publicKey } = useUnifiedWallet();
  const { splurgeClient } = useProgram();
  const { shopperData, shopperLoading } = useShopper();

  useEffect(() => {
    if (!publicKey) {
      router.replace('/shoppers/create');
    } else if (
      shopperPda !== splurgeClient.getShopperPda(publicKey).toBase58() &&
      !shopperLoading
    ) {
      router.replace(
        shopperData ? `/shoppers/${shopperData.publicKey}` : '/shoppers/create'
      );
    }
  }, [
    publicKey,
    router,
    shopperPda,
    shopperData,
    shopperLoading,
    splurgeClient,
  ]);

  return (
    <MainSection className="flex-1">
      {shopperLoading ? (
        <AccountSectionSkeleton header={true} />
      ) : (
        shopperData && (
          <AccountSection
            key={shopperPda}
            header="My Profile"
            title={shopperData.name}
            image={shopperData.image}
            prefix="Shopper ID:"
            address={shopperPda}
            content={<p>{shopperData.address}</p>}
            buttons={
              <Button asChild size={'sm'}>
                <Link href="/orders">
                  <ClipboardList />
                  View Orders
                </Link>
              </Button>
            }
          />
        )
      )}
    </MainSection>
  );
}
