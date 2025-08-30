import { PublicKey } from "@solana/web3.js";
import { admin, connection, splurgeProgram } from "../setup";

console.log("Completing order...")

// Params
const shopperPda = new PublicKey("");
const storePda = new PublicKey("");
const itemPda = new PublicKey("");
const orderPda = new PublicKey("");

const orderAcc = await splurgeProgram.account.order.fetchNullable(orderPda);
if (!orderAcc) throw new Error("Order not found");
const { owner: tokenProgram } = await connection.getAccountInfo(orderAcc.paymentMint);

const signature = await splurgeProgram.methods
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
