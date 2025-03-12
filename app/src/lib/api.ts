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

export async function fetchConfig() {
  const res = await fetch('/api/accounts/config');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.config as ParsedProgramAccount<ParsedConfig>;
}

export async function fetchAllShoppers() {
  const res = await fetch('/api/accounts/shoppers');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.shoppers as ParsedProgramAccount<ParsedShopper>[];
}

export async function fetchShopper(publicKey: string) {
  const res = await fetch(`/api/accounts/shoppers?pda=${publicKey}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.shopper as ParsedProgramAccount<ParsedShopper>;
}

export async function fetchAllStores() {
  const res = await fetch('/api/accounts/stores');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.stores as ParsedProgramAccount<ParsedStore>[];
}

export async function fetchStore(publicKey: string) {
  const res = await fetch(`/api/accounts/stores?pda=${publicKey}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.store as ParsedProgramAccount<ParsedStore>;
}

export async function fetchAllItems({
  pdas,
  storePda,
}: {
  pdas?: string[];
  storePda?: string;
}) {
  const url = `/api/accounts/items`;

  if (pdas) {
    url.concat(`?pda=${pdas.join(',')}`);
  }

  if (storePda) {
    url.concat(`?store=${storePda}`);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.items as ParsedProgramAccount<ParsedItem>[];
}

export async function fetchItem(publicKey: string) {
  const res = await fetch(`/api/accounts/items?pda=${publicKey}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.item as ParsedProgramAccount<ParsedItem>;
}

export async function fetchAllOrders({
  pdas,
  shopper,
  store,
}: {
  pdas?: string[];
  shopper?: string;
  store?: string;
}) {
  const url = '/api/accounts/orders';

  if (pdas) {
    url.concat(`?pda=${pdas.join(',')}`);
  }

  if (shopper) {
    url.concat(`?shopper=${shopper}`);
  }

  if (store) {
    url.concat(`?store=${store}`);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.orders as ParsedProgramAccount<ParsedOrder>[];
}

export async function fetchOrder(publicKey: string) {
  const res = await fetch(`/api/accounts/orders?pda=${publicKey}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.order as ParsedProgramAccount<ParsedOrder>;
}

export async function fetchAllReviews({
  pdas,
  item,
}: {
  pdas?: string[];
  item?: string;
}) {
  const url = '/api/accounts/reviews';

  if (pdas) {
    url.concat(`?pda=${pdas.join(',')}`);
  }

  if (item) {
    url.concat(`?item=${item}`);
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.reviews as ParsedProgramAccount<ParsedReview>[];
}

export async function fetchReview(publicKey: string) {
  const res = await fetch(`/api/accounts/reviews?pda=${publicKey}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data.review as ParsedProgramAccount<ParsedReview>;
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
