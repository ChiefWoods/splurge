import { VersionedTransaction } from '@solana/web3.js';

const DicebearStyles: Map<string, string> = new Map([['item', 'icons']]);

export async function getDicebearFile(
  type: string,
  seed: string = ''
): Promise<File> {
  const style = DicebearStyles.get(type);

  if (!style) {
    throw new Error('Invalid type');
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_DICEBEAR_API}/${style}/svg?seed=${seed}`,
    {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    }
  );

  const file = await res.blob();

  return new File([file], seed, { type: file.type });
}

export async function wrappedFetch(url: string) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function sendTransaction(
  tx: VersionedTransaction
): Promise<string> {
  const res = await fetch('/api/rpc', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: self.crypto.randomUUID(),
      method: 'sendTransaction',
      params: [
        Buffer.from(tx.serialize()).toString('base64'),
        {
          encoding: 'base64',
          preflightCommitment: 'confirmed',
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.result;
}
