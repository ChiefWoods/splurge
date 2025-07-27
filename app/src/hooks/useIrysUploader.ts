'use client';

import { CONNECTION } from '@/lib/constants';
import { WebUploader } from '@irys/web-upload';
import WebSolana from '@irys/web-upload-solana';
import BaseWebIrys from '@irys/web-upload/esm/base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export function useIrysUploader() {
  const wallet = useWallet();
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

  async function upload(file: File): Promise<string> {
    if (!irysUploader) {
      throw new Error('Wallet not connected.');
    }

    const price = await irysUploader.getPrice(file.size);
    await irysUploader.fund(price);

    const receipt = await irysUploader.upload(
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

    return `https://gateway.irys.xyz/${receipt.id}`;
  }

  return { upload };
}
