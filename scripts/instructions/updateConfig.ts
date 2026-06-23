import { createUpdateConfigInstruction } from "@splurge/sdk";

import { PYUSD_MINT, PYUSD_PRICE_UPDATE_V2, USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { admin, sendTransaction } from "../setup";

console.log("Updating config...");

// Params
const acceptedMints = [
  {
    mint: USDC_MINT,
    priceUpdateV2: USDC_PRICE_UPDATE_V2,
  },
  {
    mint: PYUSD_MINT,
    priceUpdateV2: PYUSD_PRICE_UPDATE_V2,
  },
];
const isPaused = null;
const newAdmin = null;
const orderFeeBps = null;

const signature = await sendTransaction([
  createUpdateConfigInstruction(
    { admin: admin.publicKey },
    {
      acceptedMints,
      isPaused,
      newAdmin,
      orderFeeBps,
    },
  ),
]);

console.log("Config updated:", signature);
