import { PublicKey } from "@solana/web3.js";
import { admin, connection, splurgeProgram, tuktukProgram } from "../setup";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TASK_QUEUE, TUKTUK_PROGRAM_ID } from "../constants";
import { nextAvailableTaskIds, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";

console.log("Updating order...")

// Params
const authorityPubkey = new PublicKey("");
const orderPda = new PublicKey("");
const itemPda = new PublicKey("");
const paymentMint = new PublicKey("");
const shopperPda = new PublicKey("");
const storePda = new PublicKey("");

const { owner: tokenProgram } = await connection.getAccountInfo(paymentMint);
const orderAta = getAssociatedTokenAddressSync(paymentMint, orderPda, true, tokenProgram);
const storeAta = getAssociatedTokenAddressSync(paymentMint, storePda, true, tokenProgram);
// Tuktuk accounts don't matter if status is "cancelled"
const taskQueueAcc = await tuktukProgram.account.taskQueueV0.fetchNullable(TASK_QUEUE);
if (!taskQueueAcc) throw new Error("Task queue not found");
const taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];
const [taskPda] = taskKey(TASK_QUEUE, taskId, TUKTUK_PROGRAM_ID);
const [taskQueueAuthorityPda] = taskQueueAuthorityKey(TASK_QUEUE, admin.publicKey);

const signature = await splurgeProgram.methods
  .shipOrder(taskId)
  .accountsPartial({
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
    tokenProgram,
    tuktuk: TUKTUK_PROGRAM_ID,
    taskQueueAuthority: taskQueueAuthorityPda,
  })
  .signers([admin])
  .rpc();

console.log("Order updated:", signature);
