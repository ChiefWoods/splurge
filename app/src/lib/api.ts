import { VersionedTransaction } from '@solana/web3.js';

export async function wrappedFetch(url: string) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function sendPermissionedTx(
  tx: VersionedTransaction
): Promise<string> {
  const res = await fetch('/api/permissioned', {
    method: 'POST',
    body: JSON.stringify({
      transaction: Buffer.from(tx.serialize()).toString('base64'),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.signature;
}
