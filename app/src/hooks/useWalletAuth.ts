'use client';

import {
  useUnifiedWallet,
  useUnifiedWalletContext,
} from '@jup-ag/wallet-adapter';

export function useWalletAuth() {
  const { connected } = useUnifiedWallet();
  const { setShowModal } = useUnifiedWalletContext();

  function checkAuth(callback: () => void) {
    if (!connected) {
      setShowModal(true);
    } else {
      callback();
    }
  }

  return { checkAuth };
}
