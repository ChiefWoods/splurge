import { PYUSD_MINT, PYUSD_PRICE_UPDATE_V2, USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { admin, splurgeProgram } from "../setup";

console.log("Updating config...")

// Params
const acceptedMints = [
  {
    mint: USDC_MINT,
    priceUpdateV2: USDC_PRICE_UPDATE_V2,
  },
  {
    mint: PYUSD_MINT,
    priceUpdateV2: PYUSD_PRICE_UPDATE_V2,
  }
];
const isPaused = null;
const newAdmin = null;
const orderFeeBps = null;
const treasury = null;

const signature = await splurgeProgram.methods
  .updateConfig({
    acceptedMints,
    isPaused,
    newAdmin,
    orderFeeBps,
    treasury,
  })
  .accounts({
    authority: admin.publicKey,
  })
  .signers([admin])
  .rpc();

console.log("Config updated:", signature);