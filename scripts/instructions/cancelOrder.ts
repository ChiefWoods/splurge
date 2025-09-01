import { PublicKey } from "@solana/web3.js";
import { admin, connection, splurgeProgram } from "../setup";

console.log("Cancelling order...")

// Params
const shopperPda = new PublicKey("");
const orderPda = new PublicKey("");
const paymentMint = new PublicKey("");

const orderAcc = await splurgeProgram.account.order.fetchNullable(orderPda);
if (!orderAcc) throw new Error("Order not found");
const { owner: tokenProgram } = await connection.getAccountInfo(orderAcc.paymentMint);

const signature = await splurgeProgram.methods
  .cancelOrder()
  .accountsPartial({
    shopper: shopperPda,
    order: orderPda,
    paymentMint,
    tokenProgram,
  })
  .signers([admin])
  .rpc();

console.log("Order cancelled:", signature);
