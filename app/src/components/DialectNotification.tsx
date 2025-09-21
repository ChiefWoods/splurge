'use client';

import '@dialectlabs/react-ui/index.css';
import { DialectSolanaSdk } from '@dialectlabs/react-sdk-blockchain-solana';
import { NotificationsButton } from '@dialectlabs/react-ui';
import { SPLURGE_PROGRAM } from '@/lib/solana-client';
import { useMemo } from 'react';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

export function DialectNotification() {
  const { publicKey, signTransaction, signMessage } = useUnifiedWallet();

  const walletAdapter = useMemo(
    () => ({
      publicKey,
      signMessage,
      signTransaction,
    }),
    [publicKey, signMessage, signTransaction]
  );

  return (
    <DialectSolanaSdk
      dappAddress={SPLURGE_PROGRAM.programId.toBase58()}
      config={{
        environment: 'production',
      }}
      customWalletAdapter={walletAdapter}
    >
      <NotificationsButton />
    </DialectSolanaSdk>
  );
}
