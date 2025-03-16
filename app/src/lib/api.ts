import { VersionedTransaction } from '@solana/web3.js';
import {
  ParsedConfig,
  ParsedItem,
  ParsedOrder,
  ParsedProgramAccount,
  ParsedReview,
  ParsedShopper,
  ParsedStore,
} from './accounts';

const DicebearStyles: Map<string, string> = new Map([
  ['shopper', 'personas'],
  ['store', 'shapes'],
  ['item', 'icons'],
]);

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

  return new File([file], file.name, { type: file.type });
}

export async function defaultFetcher(url: string) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function fetchConfig() {
  const res = await fetch('/api/accounts/config');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.config as ParsedProgramAccount<ParsedConfig>;
}

export async function fetchShoppers({ pdas }: { pdas?: string[] }) {
  const url = new URL('/api/accounts/shoppers');

  if (pdas?.length) {
    pdas.forEach((pda) => url.searchParams.append('pda', pda));
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.shoppers as ParsedProgramAccount<ParsedShopper>[];
}

export async function fetchStores({ pdas }: { pdas?: string[] }) {
  const url = new URL('/api/accounts/stores');

  if (pdas?.length) {
    pdas.forEach((pda) => url.searchParams.append('pda', pda));
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.stores as ParsedProgramAccount<ParsedStore>[];
}

export async function fetchItems({
  pdas,
  storePda,
}: {
  pdas?: string[];
  storePda?: string;
}) {
  const url = new URL('/api/accounts/items');

  if (pdas?.length) {
    pdas.forEach((pda) => url.searchParams.append('pda', pda));
  }

  if (storePda) {
    url.searchParams.append('store', storePda);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.items as ParsedProgramAccount<ParsedItem>[];
}

export async function fetchOrders({
  pdas,
  shopperPda,
  storePda,
}: {
  pdas?: string[];
  shopperPda?: string;
  storePda?: string;
}) {
  const url = new URL('/api/accounts/orders');

  if (pdas?.length) {
    pdas.forEach((pda) => url.searchParams.append('pda', pda));
  }

  if (shopperPda) {
    url.searchParams.append('shopper', shopperPda);
  }

  if (storePda) {
    url.searchParams.append('store', storePda);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.orders as ParsedProgramAccount<ParsedOrder>[];
}

export async function fetchReviews({
  pdas,
  itemPda,
}: {
  pdas?: string[];
  itemPda?: string;
}) {
  const url = new URL('/api/accounts/reviews');

  if (pdas?.length) {
    pdas.forEach((pda) => url.searchParams.append('pda', pda));
  }

  if (itemPda) {
    url.searchParams.append('item', itemPda);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.reviews as ParsedProgramAccount<ParsedReview>[];
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
