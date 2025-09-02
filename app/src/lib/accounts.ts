import { SPLURGE_PROGRAM, TUKTUK_PROGRAM } from './constants';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { getConfigPda } from './pda';
import {
  parseConfig,
  ParsedConfig,
  ParsedItem,
  ParsedOrder,
  ParsedReview,
  ParsedShopper,
  ParsedStore,
  parseItem,
  parseOrder,
  parseReview,
  parseShopper,
  parseStore,
} from '@/types/accounts';

const configPda = getConfigPda();

export async function fetchConfig(): Promise<ParsedConfig | null> {
  const configAcc =
    await SPLURGE_PROGRAM.account.config.fetchNullable(configPda);

  return configAcc
    ? { publicKey: configPda.toBase58(), ...parseConfig(configAcc) }
    : null;
}

export async function fetchAllItems(
  filters: GetProgramAccountsFilter[]
): Promise<ParsedItem[]> {
  const itemAccs = await SPLURGE_PROGRAM.account.item.all(filters);

  return itemAccs.map(({ account, publicKey }) => {
    return {
      publicKey: publicKey.toBase58(),
      ...parseItem(account),
    };
  });
}

export async function fetchMultipleItems(
  pdas: string[]
): Promise<(ParsedItem | null)[]> {
  const itemAccs = await SPLURGE_PROGRAM.account.item.fetchMultiple(pdas);

  return itemAccs.map((item, i) =>
    item ? { publicKey: pdas[i], ...parseItem(item) } : null
  );
}

export async function fetchItem(pda: string): Promise<ParsedItem | null> {
  const itemAcc = await SPLURGE_PROGRAM.account.item.fetchNullable(pda);

  return itemAcc ? { publicKey: pda, ...parseItem(itemAcc) } : null;
}

export async function fetchAllOrders(
  filters: GetProgramAccountsFilter[]
): Promise<ParsedOrder[]> {
  const orderAccs = await SPLURGE_PROGRAM.account.order.all(filters);

  return orderAccs.map(({ account, publicKey }) => {
    return {
      publicKey: publicKey.toBase58(),
      ...parseOrder(account),
    };
  });
}

export async function fetchMultipleOrders(
  pdas: string[]
): Promise<(ParsedOrder | null)[]> {
  const orderAccs = await SPLURGE_PROGRAM.account.order.fetchMultiple(pdas);

  return orderAccs.map((order, i) =>
    order ? { publicKey: pdas[i], ...parseOrder(order) } : null
  );
}

export async function fetchOrder(pda: string): Promise<ParsedOrder | null> {
  const orderAcc = await SPLURGE_PROGRAM.account.order.fetchNullable(pda);

  return orderAcc ? { publicKey: pda, ...parseOrder(orderAcc) } : null;
}

export async function fetchAllReviews(
  filters: GetProgramAccountsFilter[]
): Promise<ParsedReview[]> {
  const reviewAccs = await SPLURGE_PROGRAM.account.review.all(filters);

  return reviewAccs.map(({ account, publicKey }) => {
    return {
      publicKey: publicKey.toBase58(),
      ...parseReview(account),
    };
  });
}

export async function fetchMultipleReviews(
  pdas: string[]
): Promise<(ParsedReview | null)[]> {
  const reviewAccs = await SPLURGE_PROGRAM.account.review.fetchMultiple(pdas);

  return reviewAccs.map((review, i) =>
    review ? { publicKey: pdas[i], ...parseReview(review) } : null
  );
}

export async function fetchReview(pda: string): Promise<ParsedReview | null> {
  const reviewAcc = await SPLURGE_PROGRAM.account.review.fetchNullable(pda);

  return reviewAcc ? { publicKey: pda, ...parseReview(reviewAcc) } : null;
}

export async function fetchAllShoppers(): Promise<ParsedShopper[]> {
  const shopperAccs = await SPLURGE_PROGRAM.account.shopper.all();

  return shopperAccs.map(({ account, publicKey }) => {
    return {
      publicKey: publicKey.toBase58(),
      ...parseShopper(account),
    };
  });
}

export async function fetchMultipleShoppers(
  pdas: string[]
): Promise<(ParsedShopper | null)[]> {
  const shopperAccs = await SPLURGE_PROGRAM.account.shopper.fetchMultiple(pdas);

  return shopperAccs.map((shopper, i) =>
    shopper ? { publicKey: pdas[i], ...parseShopper(shopper) } : null
  );
}

export async function fetchShopper(pda: string): Promise<ParsedShopper | null> {
  const shopperAcc = await SPLURGE_PROGRAM.account.shopper.fetchNullable(pda);

  return shopperAcc ? { publicKey: pda, ...parseShopper(shopperAcc) } : null;
}

export async function fetchAllStores(): Promise<ParsedStore[]> {
  const storeAccs = await SPLURGE_PROGRAM.account.store.all();

  return storeAccs.map(({ account, publicKey }) => {
    return {
      publicKey: publicKey.toBase58(),
      ...parseStore(account),
    };
  });
}

export async function fetchMultipleStores(
  pdas: string[]
): Promise<(ParsedStore | null)[]> {
  const storeAccs = await SPLURGE_PROGRAM.account.store.fetchMultiple(pdas);

  return storeAccs.map((store, i) =>
    store ? { publicKey: pdas[i], ...parseStore(store) } : null
  );
}

export async function fetchStore(pda: string): Promise<ParsedStore | null> {
  const storeAcc = await SPLURGE_PROGRAM.account.store.fetchNullable(pda);

  return storeAcc ? { publicKey: pda, ...parseStore(storeAcc) } : null;
}

export async function fetchTaskQueueAcc(taskQueuePda: PublicKey) {
  return await TUKTUK_PROGRAM.account.taskQueueV0.fetchNullable(taskQueuePda);
}
