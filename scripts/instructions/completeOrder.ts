import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createCompleteOrderInstruction,
  fetchOrderAccount,
  fetchShopperAccount,
} from "@splurge/sdk";

import { admin, connection, sendTransaction } from "../setup";

console.log("Completing order...");

// Params
const shopperPda = new PublicKey("");
const storePda = new PublicKey("");
const itemPda = new PublicKey("");
const orderPda = new PublicKey("");

const orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

const paymentMint = orderAcc.paymentMint;

const mintAcc = await connection.getAccountInfo(paymentMint);
if (!mintAcc) throw new Error(`Mint not found: ${paymentMint.toBase58()}`);
const { owner: tokenProgram } = mintAcc;

const shopperAcc = (await fetchShopperAccount(connection, shopperPda)).data;
const authorityPubkey = shopperAcc.authority;

const signature = await sendTransaction([
  createCompleteOrderInstruction({
    admin: admin.publicKey,
    authority: authorityPubkey,
    shopper: shopperPda,
    store: storePda,
    item: itemPda,
    order: orderPda,
    paymentMint,
    orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true, tokenProgram),
    storeTokenAccount: getAssociatedTokenAddressSync(paymentMint, storePda, true, tokenProgram),
    tokenProgram,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  }),
]);

console.log("Order completed:", signature);
