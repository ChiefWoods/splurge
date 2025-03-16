'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { Button } from '@/components/ui/button';
import { getShopperPda } from '@/lib/pda';
import { useShopper } from '@/providers/ShopperProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';

export default function Page() {
  const { shopperPda } = useParams<{ shopperPda: string }>();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { shopper, shopperLoading } = useShopper();

  if (!publicKey) {
    router.replace('/shoppers/create');
  } else if (shopperPda !== getShopperPda(publicKey).toBase58()) {
    throw new Error('Unauthorized.');
  } else if (!shopperLoading && !shopper) {
    notFound();
  }

  return (
    <section className="main-section flex-1">
      {shopperLoading ? (
        <AccountSectionSkeleton header={true} />
      ) : (
        shopper && (
          <AccountSection
            key={shopperPda}
            header="My Profile"
            title={shopper.name}
            image={shopper.image}
            prefix="Shopper ID:"
            address={shopperPda}
            content={<p className="text-primary">{shopper.address}</p>}
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
