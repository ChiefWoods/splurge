'use client';

import '@dialectlabs/react-ui/index.css';
import { DialectSolanaSdk } from '@dialectlabs/react-sdk-blockchain-solana';
import { NotificationsButton, ThemeType } from '@dialectlabs/react-ui';
import { useEffect, useMemo, useState } from 'react';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';
import { useProgram } from '@/providers/ProgramProvider';

export function DialectNotification() {
  const { publicKey, signTransaction, signMessage } = useUnifiedWallet();
  const { splurgeClient } = useProgram();
  const [dialectTheme, setDialectTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });
  const { theme } = useTheme();

  const walletAdapter = useMemo(
    () => ({
      publicKey,
      signMessage,
      signTransaction,
    }),
    [publicKey, signMessage, signTransaction]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      setDialectTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <DialectSolanaSdk
      dappAddress={splurgeClient.getProgramId().toBase58()}
      config={{
        environment: 'production',
      }}
      customWalletAdapter={walletAdapter}
    >
      <NotificationsButton
        theme={
          theme !== undefined
            ? // ThemeType does not have 'system' option
              theme === 'system'
              ? dialectTheme
              : (theme as ThemeType)
            : dialectTheme
        }
      >
        {({ setOpen, unreadCount, ref }) => {
          return (
            <Button
              ref={ref}
              onClick={() => setOpen((open) => !open)}
              variant={'ghost'}
              size={'icon'}
              className="group hover:bg-accent! hover:text-accent-foreground! size-8"
            >
              {unreadCount > 0 && (
                <div className="absolute top-[15%] right-[15%] size-2 rounded-full bg-red-400"></div>
              )}
              <Bell size={20} className="text-foreground" />
            </Button>
          );
        }}
      </NotificationsButton>
    </DialectSolanaSdk>
  );
}
