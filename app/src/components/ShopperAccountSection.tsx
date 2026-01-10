'use client';

import { ParsedShopper } from '@/types/accounts';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { AccountSection } from './AccountSection';
import { Button } from './ui/button';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

export function ShopperAccountSection({ shopper }: { shopper: ParsedShopper }) {
  const { publicKey } = useUnifiedWallet();

  return (
    <AccountSection
      key={shopper.publicKey}
      header="My Profile"
      title={shopper.name}
      image={shopper.image}
      prefix="Shopper ID:"
      address={shopper.publicKey}
      content={<p>{shopper.address}</p>}
      buttons={
        publicKey?.toBase58() === shopper.authority && (
          <Button asChild size={'sm'}>
            <Link href="/orders">
              <ClipboardList />
              View Orders
            </Link>
          </Button>
        )
      }
    />
  );
}
