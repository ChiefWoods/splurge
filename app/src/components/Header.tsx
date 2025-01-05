'use client';

import { Loader2, ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { WalletMultiButtonDynamic } from './SolanaProvider';
import useSWR from 'swr';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getShopperPda, getStorePda } from '@/lib/pda';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';

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
      href: '/orders',
    },
  ];

  return (
    <header className="sticky top-0 flex items-center justify-between bg-slate-200 px-9 py-6">
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
            <AvatarImage src={shopper.data?.acc?.image} className="bg-white" />
            <AvatarFallback>
              {shopper.isLoading ? (
                <Loader2 className="animate-spin text-muted-foreground" />
              ) : (
                <Image
                  src="/default_shopper.svg"
                  alt="Default Shopper Image"
                  fill
                  className="p-1"
                />
              )}
            </AvatarFallback>
          </Avatar>
        </Link>
        <WalletMultiButtonDynamic />
      </nav>
    </header>
  );
}
