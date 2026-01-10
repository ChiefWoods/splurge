import { SplurgeClient } from '@/classes/SplurgeClient';
import {
  parseConfig,
  parseItem,
  parseOrder,
  parseReview,
  parseShopper,
  parseStore,
} from '@/types/accounts';
import { GetProgramAccountsFilter } from '@solana/web3.js';
import { DISCRIMINATOR_SIZE } from './constants';

// Config
export async function fetchConfig(client: SplurgeClient) {
  return client.fetchProgramAccount(
    SplurgeClient.configPda.toBase58(),
    'config',
    parseConfig
  );
}

// Items
export async function fetchAllItems(
  client: SplurgeClient,
  queries: { store?: string } = {}
) {
  const { store } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (store) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: store,
        // encoding: 'base58',
      },
    });
  }

  return client.fetchAllProgramAccounts('item', parseItem, filters);
}

export async function fetchMultipleItems(
  client: SplurgeClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, 'item', parseItem);
}

export async function fetchItem(client: SplurgeClient, pda: string) {
  return client.fetchProgramAccount(pda, 'item', parseItem);
}

// Orders
export async function fetchAllOrders(
  client: SplurgeClient,
  queries: { shopper?: string; store?: string } = {}
) {
  const { shopper, store } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (shopper) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: shopper,
        // encoding: 'base58',
      },
    });
  }

  let orders = await client.fetchAllProgramAccounts(
    'order',
    parseOrder,
    filters
  );

  // filter for orders with a matching item PDA
  if (store) {
    const items = await client.fetchAllProgramAccounts('item', parseItem, [
      {
        memcmp: {
          offset: DISCRIMINATOR_SIZE,
          bytes: store,
          // encoding: 'base58',
        },
      },
    ]);

    const itemPdas = items.map((item) => item.publicKey);

    orders = orders.filter(({ item }) => itemPdas.includes(item));
  }

  return orders;
}

export async function fetchMultipleOrders(
  client: SplurgeClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, 'order', parseOrder);
}

export async function fetchOrder(client: SplurgeClient, pda: string) {
  return client.fetchProgramAccount(pda, 'order', parseOrder);
}

// Reviews
export async function fetchAllReviews(
  client: SplurgeClient,
  queries: { item?: string } = {}
) {
  const { item } = queries;

  let reviews = await client.fetchAllProgramAccounts('review', parseReview);

  // filter for reviews with a matching order PDA
  if (item) {
    const orderAccs = await client.fetchAllProgramAccounts(
      'order',
      parseOrder,
      [
        {
          memcmp: {
            offset: DISCRIMINATOR_SIZE + 32,
            bytes: item,
            // encoding: 'base58',
          },
        },
      ]
    );

    const orderPdas = orderAccs.map(({ publicKey }) => publicKey);

    reviews = reviews.filter(({ order }) => orderPdas.includes(order));
  }

  return reviews;
}

export async function fetchMultipleReviews(
  client: SplurgeClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, 'review', parseReview);
}

export async function fetchReview(client: SplurgeClient, pda: string) {
  return client.fetchProgramAccount(pda, 'review', parseReview);
}

// Shoppers
export async function fetchAllShoppers(
  client: SplurgeClient,
  queries: { authority?: string } = {}
) {
  const { authority } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (authority) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: authority,
        // encoding: 'base58',
      },
    });
  }

  return client.fetchAllProgramAccounts('shopper', parseShopper, filters);
}

export async function fetchMultipleShoppers(
  client: SplurgeClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, 'shopper', parseShopper);
}

export async function fetchShopper(client: SplurgeClient, pda: string) {
  return client.fetchProgramAccount(pda, 'shopper', parseShopper);
}

// Stores
export async function fetchAllStores(
  client: SplurgeClient,
  queries: { authority?: string } = {}
) {
  const { authority } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (authority) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: authority,
        // encoding: 'base58',
      },
    });
  }

  return client.fetchAllProgramAccounts('store', parseStore, filters);
}

export async function fetchMultipleStores(
  client: SplurgeClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, 'store', parseStore);
}

export async function fetchStore(client: SplurgeClient, pda: string) {
  return client.fetchProgramAccount(pda, 'store', parseStore);
}
