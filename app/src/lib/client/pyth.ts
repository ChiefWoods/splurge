import { HermesClient } from '@pythnetwork/hermes-client';
import { ACCEPTED_MINTS_METADATA } from '../constants';

export const HERMES_CLIENT = new HermesClient(
  process.env.NEXT_PUBLIC_PYTH_HERMES_URL as string
);

export async function getPrices(ids: string[]) {
  const priceUpdates = await HERMES_CLIENT.getLatestPriceUpdates(ids);

  if (!priceUpdates.parsed) {
    throw new Error('Unable to get parsed price updates.');
  }

  return priceUpdates.parsed.map(({ price }, i) => {
    return {
      mint: Array.from(ACCEPTED_MINTS_METADATA.keys())[i],
      price: Number(price.price) * 10 ** price.expo,
    };
  });
}
