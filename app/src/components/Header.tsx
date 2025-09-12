'use client';

import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { useMemo } from 'react';
import { Keypair } from '@solana/web3.js';
import { getDicebearEndpoint } from '@/lib/dicebear';
import { DialectNotification } from './DialectNotification';
import { UnifiedWalletButton, useUnifiedWallet } from '@jup-ag/wallet-adapter';

export function Header() {
  const { publicKey } = useUnifiedWallet();
  const { shopperData, shopperIsLoading } = useShopper();
  const { personalStoreData } = useStore();

  const avatarSeed = useMemo(() => {
    return publicKey?.toBase58() ?? Keypair.generate().publicKey.toBase58();
  }, [publicKey]);

  const navLinks = [
    {
      name: 'My Store',
      href: personalStoreData
        ? `/stores/${personalStoreData.publicKey}`
        : '/stores/create',
    },
    {
      name: 'My Orders',
      href: shopperData ? `/orders` : '/shoppers/create',
    },
  ];

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-slate-200 px-9 py-6">
      <Link href={'/'} className="flex items-center gap-4">
        <ShoppingCartIcon size={36} />
        <h1>Splurge</h1>
      </Link>
      <nav className="flex items-center gap-8">
        <ul className="flex items-center gap-6">
          {navLinks.map(({ name, href }) => (
            <li key={href}>
              <Link href={href} className="hover:underline">
                {name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={
            shopperData
              ? `/shoppers/${shopperData.publicKey}`
              : '/shoppers/create'
          }
        >
          <Avatar>
            {shopperIsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <AvatarImage
                src={
                  shopperData?.image ??
                  `${getDicebearEndpoint('shopper')}?seed=${avatarSeed}`
                }
                className="bg-white"
              />
            )}
          </Avatar>
        </Link>
        <DialectNotification />
        <UnifiedWalletButton />
      </nav>
    </header>
  );
}
