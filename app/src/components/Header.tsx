'use client';

import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { WalletMultiButtonDynamic } from './SolanaProvider';
import useSWR from 'swr';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getShopperPda, getStorePda } from '@/lib/pda';
import { Avatar, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

export default function Header() {
  const { publicKey } = useWallet();
  const { getShopperAcc, getStoreAcc } = useAnchorProgram();
  const shopper = useSWR(
    publicKey ? { url: '/api/shoppers', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getShopperPda(publicKey);
      const acc = await getShopperAcc(pda);

      return { pda, acc };
    }
  );
  const store = useSWR(
    publicKey ? { url: '/api/stores', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getStorePda(publicKey);
      const acc = await getStoreAcc(pda);

      return { pda, acc };
    }
  );

  const navLinks = [
    {
      name: 'Browse Stores',
      href: '/stores',
    },
    {
      name: 'My Store',
      href: store.data?.acc ? `/stores/${store.data.pda}` : '/stores/create',
    },
    {
      name: 'My Orders',
      href: shopper.data?.acc ? `/orders` : '/shoppers/create',
    },
  ];

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-slate-200 px-9 py-6">
      <Link href={'/'} className="flex items-center gap-4">
        <ShoppingCartIcon size={48} />
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
            shopper.data?.acc
              ? `/shoppers/${shopper.data?.pda}`
              : '/shoppers/create'
          }
        >
          <Avatar>
            {shopper.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <AvatarImage
                src={shopper.data?.acc?.image ?? '/default_shopper.svg'}
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
