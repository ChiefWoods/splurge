'use client';

import { ShoppingCartIcon, UserRound } from 'lucide-react';
import Link from 'next/link';
import { WalletMultiButtonDynamic } from './SolanaProvider';

const navLinks = [
  {
    name: 'Browse Stores',
    href: '/stores',
  },
  {
    name: 'My Store',
    href: '/store/testid',
  },
  {
    name: 'My Orders',
    href: '/store/testid/orders',
  },
];

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-slate-200 px-9 py-6">
      <Link href={'/'} className="flex items-center gap-4">
        <ShoppingCartIcon size={48} />
        <h1>Splurge</h1>
      </Link>
      <nav className="flex items-center gap-8">
        <ul className="flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:underline">
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={'/shopper/testid'}>
          <UserRound size={40} className="rounded-full border" />
        </Link>
        <WalletMultiButtonDynamic />
      </nav>
    </header>
  );
}
