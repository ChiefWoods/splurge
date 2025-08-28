import { VersionedTransaction } from '@solana/web3.js';

const DicebearStyles: Map<string, string> = new Map([
  ['shopper', 'personas'],
  ['store', 'shapes'],
  ['item', 'icons'],
]);

export function getDicebearEndpoint(type: string) {
  const style = DicebearStyles.get(type);

  if (!style) {
    throw new Error('Invalid type');
  }

  return `${process.env.NEXT_PUBLIC_DICEBEAR_API}/${style}/svg`;
}

export async function getDicebearFile(
  type: string,
  seed: string = ''
): Promise<File> {
  const res = await fetch(`${getDicebearEndpoint(type)}?seed=${seed}`, {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

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

export async function updateOrder(tx: VersionedTransaction): Promise<string> {
  const res = await fetch('/api/update-order', {
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
