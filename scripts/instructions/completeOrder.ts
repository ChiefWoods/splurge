import { PublicKey } from "@solana/web3.js";
import { admin, program } from "../setup";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

console.log("Completing order...")

// Params
const shopperPda = new PublicKey("");
const storePda = new PublicKey("");
const itemPda = new PublicKey("");
const orderPda = new PublicKey("");
const tokenProgram = TOKEN_PROGRAM_ID;

const signature = await program.methods
  .completeOrder()
  .accountsPartial({
    admin: admin.publicKey,
    shopper: shopperPda,
    store: storePda,
    item: itemPda,
    order: orderPda,
    tokenProgram,
  })
  .signers([admin])
  .rpc();

console.log("Order completed:", signature);
