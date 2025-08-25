import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { admin, program, treasury } from "../setup";

console.log("Initializing config...")

// Params
const acceptedMints = [
  {
    mint: USDC_MINT,
    priceUpdateV2: USDC_PRICE_UPDATE_V2,
  },
];
const orderFeeBps = 250;

const signature = await program.methods
  .initializeConfig({
    acceptedMints,
    admin: admin.publicKey,
    orderFeeBps,
    treasury: treasury.publicKey,
  })
  .accounts({
    authority: admin.publicKey,
  })
  .signers([admin])
  .rpc();

console.log("Config initialized:", signature);