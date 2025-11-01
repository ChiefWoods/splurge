import { HermesClient } from '@pythnetwork/hermes-client';

export const HERMES_CLIENT = new HermesClient(
  process.env.NEXT_PUBLIC_PYTH_HERMES_URL as string
);
