'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { Button } from '@/components/ui/button';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getShopperPda } from '@/lib/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';

export default function Page() {
  const { shopperPda } = useParams<{ shopperPda: string }>();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { getShopperAcc } = useAnchorProgram();

  if (!publicKey) {
    router.replace('/shoppers/create');
  } else if (shopperPda !== getShopperPda(publicKey).toBase58()) {
    throw new Error('Unauthorized.');
  }

  const shopper = useSWR(`/api/shoppers/${shopperPda}`, async () => {
    const acc = await getShopperAcc(new PublicKey(shopperPda));

    return { acc };
  });

  return (
    <section className="main-section flex-1">
      {shopper.isLoading ? (
        <AccountSectionSkeleton header={true} />
      ) : (
        shopper.data &&
        shopper.data.acc && (
          <AccountSection
            key={shopperPda}
            header="My Profile"
            title={shopper.data.acc.name}
            image={shopper.data.acc.image}
            prefix="Shopper ID:"
            address={shopperPda}
            content={<p className="text-primary">{shopper.data.acc.address}</p>}
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
