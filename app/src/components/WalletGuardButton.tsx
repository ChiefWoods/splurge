'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function WalletGuardButton({
  variant = 'default',
  size = 'default',
  setOpen,
  children,
}: {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'icon' | 'sm' | 'lg';
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(size === 'icon' ? 'aspect-square' : '')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!publicKey) {
          setVisible(true);
        } else {
          setOpen(true);
        }
      }}
    >
      {children}
    </Button>
  );
}
