'use client';

import { Button } from './ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useWalletAuth } from '@/hooks/useWalletAuth';

export function WalletGuardButton({
  variant = 'default',
  size = 'default',
  className,
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
  className?: string;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const { checkAuth } = useWalletAuth();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(size === 'icon' ? 'aspect-square' : '', className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        checkAuth(() => setOpen(true));
      }}
    >
      {children}
    </Button>
  );
}
