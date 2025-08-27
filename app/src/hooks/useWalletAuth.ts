'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function useWalletAuth() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  function checkAuth(callback: () => void) {
    if (!connected) {
      setVisible(true);
    } else {
      callback();
    }
  }

  return { checkAuth };
}
