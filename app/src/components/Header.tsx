'use client';

import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { WalletMultiButtonDynamic } from '@/providers/SolanaProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { Avatar, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { useMemo } from 'react';
import { Keypair } from '@solana/web3.js';
import { getDicebearEndpoint } from '@/lib/api';

export function Header() {
  const { publicKey } = useWallet();
  const { shopper } = useShopper();
  const { personalStore } = useStore();

  const avatarSeed = useMemo(() => {
    return publicKey?.toBase58() ?? Keypair.generate().publicKey.toBase58();
  }, [publicKey]);

  const navLinks = [
    {
      name: 'Browse Stores',
      href: '/stores',
    },
    {
      name: 'My Store',
      href: personalStore.data
        ? `/stores/${personalStore.data.publicKey}`
        : '/stores/create',
    },
    {
      name: 'My Orders',
      href: shopper.data ? `/orders` : '/shoppers/create',
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
            shopper.data
              ? `/shoppers/${shopper.data.publicKey}`
              : '/shoppers/create'
          }
        >
          <Avatar>
            {shopper.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <AvatarImage
                src={
                  shopper.data?.image ??
                  `${getDicebearEndpoint('shopper')}?seed=${avatarSeed}`
                }
                className="bg-white"
              />
            )}
          </Avatar>
        </Link>
        <WalletMultiButtonDynamic />
      </nav>
    </header>
  );
}
