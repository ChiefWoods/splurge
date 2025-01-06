'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ReactNode } from 'react';

export function WalletGuardButton({
  variant = 'default',
  size = 'default',
  setOpen,
  children,
}: {
  variant?: 'default' | 'secondary';
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
      onClick={(e) => {
        if (!publicKey) {
          e.preventDefault();
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
