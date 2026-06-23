/**
 * Generated SDK fetcher wrappers that serialize account data into values safe
 * for client-server transmission.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  fetchAllMaybeItemAccounts,
  fetchAllMaybeOrderAccounts,
  fetchAllMaybeReviewAccounts,
  fetchAllMaybeShopperAccounts,
  fetchAllMaybeStoreAccounts,
  fetchConfigAccount,
  fetchProgramAccountsItem,
  fetchProgramAccountsOrder,
  fetchProgramAccountsReview,
  fetchProgramAccountsShopper,
  fetchProgramAccountsStore,
  findConfigPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";

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
} from "@/types/accounts";
import { parseProgramAccount } from "@/types/parse";

import { DISCRIMINATOR_SIZE } from "./constants";

export async function fetchConfig(connection: Connection): Promise<ParsedConfig> {
  const config = await fetchConfigAccount(connection, findConfigPda()[0]);

  return parseProgramAccount(config, parseConfig);
}

export async function fetchAllItems(
  connection: Connection,
  queries: { store?: string } = {},
): Promise<ParsedItem[]> {
  const filters = queries.store
    ? [{ memcmp: { offset: DISCRIMINATOR_SIZE, bytes: queries.store } }]
    : [];
  return (await fetchProgramAccountsItem(connection, SPLURGE_PROGRAM_ID, { filters })).map(
    (account) => parseProgramAccount(account, parseItem),
  );
}

export async function fetchMultipleItems(
  connection: Connection,
  pdas: string[],
): Promise<(ParsedItem | null)[]> {
  return (
    await fetchAllMaybeItemAccounts(
      connection,
      pdas.map((pda) => new PublicKey(pda)),
    )
  ).map((account) => (account ? parseProgramAccount(account, parseItem) : null));
}

export async function fetchItem(connection: Connection, pda: string): Promise<ParsedItem | null> {
  const [account] = await fetchAllMaybeItemAccounts(connection, [new PublicKey(pda)]);
  return account ? parseProgramAccount(account, parseItem) : null;
}

export async function fetchAllOrders(
  connection: Connection,
  queries: { shopper?: string; store?: string } = {},
): Promise<ParsedOrder[]> {
  const filters = queries.shopper
    ? [{ memcmp: { offset: DISCRIMINATOR_SIZE, bytes: queries.shopper } }]
    : [];
  let orders = (await fetchProgramAccountsOrder(connection, SPLURGE_PROGRAM_ID, { filters })).map(
    (account) => parseProgramAccount(account, parseOrder),
  );
  if (queries.store) {
    const items = await fetchAllItems(connection, { store: queries.store });
    const itemAddresses = new Set(items.map(({ address }) => address));
    orders = orders.filter(({ data }) => itemAddresses.has(data.item));
  }
  return orders;
}

export async function fetchMultipleOrders(
  connection: Connection,
  pdas: string[],
): Promise<(ParsedOrder | null)[]> {
  return (
    await fetchAllMaybeOrderAccounts(
      connection,
      pdas.map((pda) => new PublicKey(pda)),
    )
  ).map((account) => (account ? parseProgramAccount(account, parseOrder) : null));
}

export async function fetchOrder(connection: Connection, pda: string): Promise<ParsedOrder | null> {
  const [account] = await fetchAllMaybeOrderAccounts(connection, [new PublicKey(pda)]);
  return account ? parseProgramAccount(account, parseOrder) : null;
}

export async function fetchAllReviews(
  connection: Connection,
  queries: { item?: string } = {},
): Promise<ParsedReview[]> {
  let reviews = (await fetchProgramAccountsReview(connection, SPLURGE_PROGRAM_ID)).map((account) =>
    parseProgramAccount(account, parseReview),
  );
  if (queries.item) {
    const orders = (
      await fetchProgramAccountsOrder(connection, SPLURGE_PROGRAM_ID, {
        filters: [{ memcmp: { offset: DISCRIMINATOR_SIZE + 32, bytes: queries.item } }],
      })
    ).map((account) => parseProgramAccount(account, parseOrder));
    const orderAddresses = new Set(orders.map(({ address }) => address));
    reviews = reviews.filter(({ data }) => orderAddresses.has(data.order));
  }
  return reviews;
}

export async function fetchMultipleReviews(
  connection: Connection,
  pdas: string[],
): Promise<(ParsedReview | null)[]> {
  return (
    await fetchAllMaybeReviewAccounts(
      connection,
      pdas.map((pda) => new PublicKey(pda)),
    )
  ).map((account) => (account ? parseProgramAccount(account, parseReview) : null));
}

export async function fetchReview(
  connection: Connection,
  pda: string,
): Promise<ParsedReview | null> {
  const [account] = await fetchAllMaybeReviewAccounts(connection, [new PublicKey(pda)]);
  return account ? parseProgramAccount(account, parseReview) : null;
}

export async function fetchAllShoppers(
  connection: Connection,
  queries: { authority?: string } = {},
): Promise<ParsedShopper[]> {
  const filters = queries.authority
    ? [{ memcmp: { offset: DISCRIMINATOR_SIZE, bytes: queries.authority } }]
    : [];
  return (await fetchProgramAccountsShopper(connection, SPLURGE_PROGRAM_ID, { filters })).map(
    (account) => parseProgramAccount(account, parseShopper),
  );
}

export async function fetchMultipleShoppers(
  connection: Connection,
  pdas: string[],
): Promise<(ParsedShopper | null)[]> {
  return (
    await fetchAllMaybeShopperAccounts(
      connection,
      pdas.map((pda) => new PublicKey(pda)),
    )
  ).map((account) => (account ? parseProgramAccount(account, parseShopper) : null));
}

export async function fetchShopper(
  connection: Connection,
  pda: string,
): Promise<ParsedShopper | null> {
  const [account] = await fetchAllMaybeShopperAccounts(connection, [new PublicKey(pda)]);
  return account ? parseProgramAccount(account, parseShopper) : null;
}

export async function fetchAllStores(
  connection: Connection,
  queries: { authority?: string } = {},
): Promise<ParsedStore[]> {
  const filters = queries.authority
    ? [{ memcmp: { offset: DISCRIMINATOR_SIZE, bytes: queries.authority } }]
    : [];
  return (await fetchProgramAccountsStore(connection, SPLURGE_PROGRAM_ID, { filters })).map(
    (account) => parseProgramAccount(account, parseStore),
  );
}

export async function fetchMultipleStores(
  connection: Connection,
  pdas: string[],
): Promise<(ParsedStore | null)[]> {
  return (
    await fetchAllMaybeStoreAccounts(
      connection,
      pdas.map((pda) => new PublicKey(pda)),
    )
  ).map((account) => (account ? parseProgramAccount(account, parseStore) : null));
}

export async function fetchStore(connection: Connection, pda: string): Promise<ParsedStore | null> {
  const [account] = await fetchAllMaybeStoreAccounts(connection, [new PublicKey(pda)]);
  return account ? parseProgramAccount(account, parseStore) : null;
}
