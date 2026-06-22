import { nextAvailableTaskIds, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createShipOrderInstruction } from "@splurge/sdk";

import { TUKTUK_PROGRAM_ID } from "../../common/tuktuk";
import { TASK_QUEUE } from "../constants";
import { admin, connection, sendTransaction, tuktukProgram } from "../setup";

console.log("Updating order...");

// Params
const authorityPubkey = new PublicKey("");
const orderPda = new PublicKey("");
const itemPda = new PublicKey("");
const paymentMint = new PublicKey("");
const shopperPda = new PublicKey("");
const storePda = new PublicKey("");

const mintAcc = await connection.getAccountInfo(paymentMint);
if (!mintAcc) throw new Error(`Mint not found: ${paymentMint.toBase58()}`);
const { owner: tokenProgram } = mintAcc;

const orderAta = getAssociatedTokenAddressSync(paymentMint, orderPda, true, tokenProgram);
const storeAta = getAssociatedTokenAddressSync(paymentMint, storePda, true, tokenProgram);
// Tuktuk accounts don't matter if status is "cancelled"
const taskQueueAcc = await tuktukProgram.account.taskQueueV0.fetchNullable(TASK_QUEUE);
if (!taskQueueAcc) throw new Error("Task queue not found");

const taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];
const [taskPda] = taskKey(TASK_QUEUE, taskId, TUKTUK_PROGRAM_ID);
const [taskQueueAuthorityPda] = taskQueueAuthorityKey(TASK_QUEUE, admin.publicKey);

const signature = await sendTransaction([
  createShipOrderInstruction(
    {
      admin: admin.publicKey,
      order: orderPda,
      authority: authorityPubkey,
      item: itemPda,
      orderTokenAccount: orderAta,
      paymentMint,
      shopper: shopperPda,
      store: storePda,
      storeTokenAccount: storeAta,
      task: taskPda,
      taskQueue: TASK_QUEUE,
      taskQueueAuthority: taskQueueAuthorityPda,
      tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tuktuk: TUKTUK_PROGRAM_ID,
    },
    { taskId },
  ),
]);

console.log("Order updated:", signature);
