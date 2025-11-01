'use client';

import { CONNECTION } from '@/lib/client/solana';
import { WebUploader } from '@irys/web-upload';
import { WebSolana } from '@irys/web-upload-solana';
import BaseWebIrys from '@irys/web-upload/esm/base';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useCallback, useEffect, useState } from 'react';

export function useIrysUploader() {
  const wallet = useUnifiedWallet();
  const [irysUploader, setIrysUploader] = useState<BaseWebIrys | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      (async () => {
        try {
          const irysUploader = await WebUploader(WebSolana)
            .withProvider(wallet)
            .withRpc(CONNECTION.rpcEndpoint)
            .devnet();

          setIrysUploader(irysUploader);
        } catch (error) {
          console.error(error);
        }
      })();
    }
  }, [wallet]);

  const upload = useCallback(
    async (file: File) => {
      if (!irysUploader) {
        throw new Error('Wallet not connected.');
      }

      const price = await irysUploader.getPrice(file.size);
      // user signs and sends transaction here
      await irysUploader.fund(price);

      const { id } = await irysUploader.upload(
        Buffer.from(await file.arrayBuffer()),
        {
          tags: [
            {
              name: 'Content-Type',
              value: file.type,
            },
            {
              name: 'Name',
              value: file.name,
            },
          ],
        }
      );

      return `${process.env.NEXT_PUBLIC_IRYS_GATEWAY}/${id}`;
    },
    [irysUploader]
  );

  return { upload };
}
