import { PublicKey } from "@solana/web3.js";
import { admin, program } from "../setup";
import { IdlTypes } from "@coral-xyz/anchor";
import { Splurge } from "../../target/types/splurge";

type OrderStatus = IdlTypes<Splurge>['orderStatus'];

console.log("Updating order...")

// Params
const status: OrderStatus = { shipping: {} };
const orderPda = new PublicKey("");

const signature = await program.methods
  .updateOrder(status)
  .accounts({
    authority: admin.publicKey,
    order: orderPda,
  })
  .signers([admin])
  .rpc();

console.log("Order updated:", signature);
