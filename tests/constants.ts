import { PublicKey } from '@solana/web3.js';
import idl from '../target/idl/splurge.json';
import usdcPriceUpdateV2AccInfo from './fixtures/usdc_price_update_v2.json';
import usdtPriceUpdateV2AccInfo from './fixtures/usdt_price_update_v2.json';

export const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);
export const MAX_SHOPPER_NAME_LEN = 64;
export const MAX_STORE_NAME_LEN = 64;
export const MAX_STORE_ITEM_NAME_LEN = 32;
export const USDC_MINT = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);
export const USDT_MINT = new PublicKey(
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
);
export const MINT_DECIMALS = 6;
export const USDC_PRICE_UPDATE_V2 = new PublicKey(
  usdcPriceUpdateV2AccInfo.pubkey
);
export const USDT_PRICE_UPDATE_V2 = new PublicKey(
  usdtPriceUpdateV2AccInfo.pubkey
);
