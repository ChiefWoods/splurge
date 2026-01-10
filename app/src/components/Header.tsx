'use client';

import { Menu, ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { useMemo, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { DialectNotification } from './DialectNotification';
import { UnifiedWalletButton, useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { DicebearStyles, getDicebearEndpoint } from '@/lib/client/dicebear';
import { SettingsDropdown } from './SettingsDropdown';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Button } from './ui/button';

export function Header() {
  const { publicKey } = useUnifiedWallet();
  const { shopperData } = useShopper();
  const { storeData } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const avatarSeed = useMemo(() => {
    return publicKey?.toBase58() ?? Keypair.generate().publicKey.toBase58();
  }, [publicKey]);

  const navLinks = [
    {
      name: 'My Store',
      href: storeData ? `/stores/${storeData.publicKey}` : '/stores/create',
    },
    {
      name: 'My Orders',
      href: shopperData ? `/orders` : '/shoppers/create',
    },
  ];

  return (
    <header className="border-b-primary bg-background sticky top-0 z-10 flex h-20 w-full items-center justify-between gap-4 border-b px-6 py-4">
      <Link href={'/'} className="*:text-primary flex items-center gap-2">
        <ShoppingCartIcon size={24} />
        <h1 className="hidden text-2xl font-medium sm:block md:text-3xl">
          Splurge
        </h1>
      </Link>
      <nav className="ml-auto hidden items-center gap-6 md:flex">
        <ul className="flex items-center gap-4">
          {navLinks.map(({ name, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-medium text-nowrap hover:underline"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <DialectNotification />
          <SettingsDropdown />
        </div>
      </nav>
      <div className="ml-auto flex gap-1 md:hidden">
        <div className="hidden gap-1 sm:flex">
          <DialectNotification />
          <SettingsDropdown />
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size={'icon'}
              className="*:text-foreground size-8"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <Link
                href={'/'}
                className="*:text-primary flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingCartIcon size={20} />
                <SheetTitle className="text-xl font-medium">Splurge</SheetTitle>
              </Link>
            </SheetHeader>
            <nav className="mt-6">
              <ul className="flex flex-col gap-4">
                {navLinks.map(({ name, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-medium text-nowrap hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
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
    </header>
  );
}
