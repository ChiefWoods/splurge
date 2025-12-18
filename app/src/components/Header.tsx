'use client';

import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
import { useShopper } from '@/providers/ShopperProvider';
import { usePersonalStore } from '@/providers/PersonalStoreProvider';
import { useMemo } from 'react';
import { Keypair } from '@solana/web3.js';
import { DialectNotification } from './DialectNotification';
import { UnifiedWalletButton, useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { DicebearStyles, getDicebearEndpoint } from '@/lib/client/dicebear';
import { SettingsDropdown } from './SettingsDropdown';

export function Header() {
  const { publicKey } = useUnifiedWallet();
  const { shopperData } = useShopper();
  const { personalStoreData } = usePersonalStore();

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
    <header className="border-b-primary bg-background sticky top-0 z-10 flex h-20 items-center justify-between border-b px-6 py-4">
      <Link href={'/'} className="*:text-primary flex items-center gap-2">
        <ShoppingCartIcon size={24} />
        <h1 className="text-3xl font-medium">Splurge</h1>
      </Link>
      <nav className="flex items-center gap-6">
        <ul className="flex items-center gap-4">
          {navLinks.map(({ name, href }) => (
            <li key={href}>
              <Link href={href} className="font-medium hover:underline">
                {name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <DialectNotification />
          <SettingsDropdown />
        </div>
        <div className="flex items-center gap-3">
          {shopperData && (
            <Link href={`/shoppers/${shopperData.publicKey}`}>
              <Avatar className="size-7">
                <AvatarImage
                  src={
                    shopperData.image ??
                    getDicebearEndpoint(DicebearStyles.Shopper, avatarSeed)
                  }
                  className="bg-white"
                />
              </Avatar>
            </Link>
          )}
          <UnifiedWalletButton
            buttonClassName="bg-primary!"
            currentUserClassName="bg-primary!"
          />
        </div>
      </nav>
    </header>
  );
}
