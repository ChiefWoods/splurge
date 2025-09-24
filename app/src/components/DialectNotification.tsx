'use client';

import '@dialectlabs/react-ui/index.css';
import { DialectSolanaSdk } from '@dialectlabs/react-sdk-blockchain-solana';
import { NotificationsButton, ThemeType } from '@dialectlabs/react-ui';
import { SPLURGE_PROGRAM } from '@/lib/solana-client';
import { useEffect, useMemo, useState } from 'react';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';

export function DialectNotification() {
  const { publicKey, signTransaction, signMessage } = useUnifiedWallet();
  const [dialectTheme, setDialectTheme] = useState<'light' | 'dark'>('light');
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
    setDialectTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setDialectTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <DialectSolanaSdk
      dappAddress={SPLURGE_PROGRAM.programId.toBase58()}
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
              className="size-8"
            >
              {unreadCount > 0 && (
                <div className="absolute right-[15%] top-[15%] size-2 rounded-full bg-red-400"></div>
              )}
              <Bell size={20} />
            </Button>
          );
        }}
      </NotificationsButton>
    </DialectSolanaSdk>
  );
}
