'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { Button } from '@/components/ui/button';
import { getShopperPda } from '@/lib/pda';
import { useShopper } from '@/providers/ShopperProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { shopperPda } = useParams<{ shopperPda: string }>();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { shopperData, shopperIsLoading } = useShopper();

  useEffect(() => {
    if (!publicKey) {
      router.replace('/shoppers/create');
    } else if (
      shopperPda !== getShopperPda(publicKey).toBase58() &&
      !shopperIsLoading
    ) {
      router.replace(
        shopperData ? `/shoppers/${shopperData.publicKey}` : '/shoppers/create'
      );
    }
  }, [publicKey, router, shopperPda, shopperData, shopperIsLoading]);

  return (
    <section className="main-section flex-1">
      {shopperIsLoading ? (
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
            content={<p className="text-primary">{shopperData.address}</p>}
            buttons={
              <Button asChild variant={'secondary'} size={'sm'}>
                <Link href="/orders">
                  <ClipboardList />
                  View Orders
                </Link>
              </Button>
            }
          />
        )
      )}
    </section>
  );
}
