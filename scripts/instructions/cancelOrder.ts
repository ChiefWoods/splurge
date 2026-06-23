import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { createCancelOrderInstruction, fetchOrderAccount, fetchShopperAccount } from "@splurge/sdk";

import { admin, connection, sendTransaction, treasury } from "../setup";

console.log("Cancelling order...");

// Params
const shopperPda = new PublicKey("");
const orderPda = new PublicKey("");

const orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

const paymentMint = orderAcc.paymentMint;

const mintAcc = await connection.getAccountInfo(paymentMint);
if (!mintAcc) throw new Error(`Mint not found: ${paymentMint.toBase58()}`);
const { owner: tokenProgram } = mintAcc;

const shopperAcc = (await fetchShopperAccount(connection, shopperPda)).data;
const authorityPubkey = shopperAcc.authority;

const signature = await sendTransaction([
  createCancelOrderInstruction({
    admin: admin.publicKey,
    authority: authorityPubkey,
    order: orderPda,
    paymentMint,
    shopper: shopperPda,
    treasuryTokenAccount: getAssociatedTokenAddressSync(
      paymentMint,
      treasury,
      !PublicKey.isOnCurve(treasury),
      tokenProgram,
    ),
    orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true, tokenProgram),
    authorityTokenAccount: getAssociatedTokenAddressSync(
      paymentMint,
      authorityPubkey,
      !PublicKey.isOnCurve(authorityPubkey),
      tokenProgram,
    ),
  }),
]);

console.log("Order cancelled:", signature);
