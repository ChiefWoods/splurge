import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from "@helium/tuktuk-sdk";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createCompleteOrderInstruction,
  createCreateOrderInstruction,
  createInitializeConfigInstruction,
  createInitializeShopperInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createShipOrderInstruction,
  createWithdrawEarningsInstruction,
  findItemPda,
  findOrderPda,
  findShopperPda,
  findStorePda,
  findTreasuryPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";
import { LiteSVM } from "litesvm";

import { TUKTUK_PROGRAM_ID } from "../../common/tuktuk";
import { fetchTaskQueueAcc } from "../accounts";
import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
  initTaskQueue,
  sendTransaction,
} from "../setup";

describe("withdrawEarnings", () => {
  let { litesvm, provider, tuktukProgram, taskQueuePda } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    tuktukProgram: Program<Tuktuk>;
    taskQueuePda: PublicKey;
  };

  const [admin, shopperAuthority, storeAuthority] = Array.from({ length: 3 }, Keypair.generate);
  const treasury = findTreasuryPda(SPLURGE_PROGRAM_ID)[0];

  const itemName = "Item A";
  const itemPrice = 1e6; // $1
  const initInventoryCount = 10;
  const initShopperAtaBal = 1e8; // $100
  const paymentMint = USDC_MINT;
  const tokenProgram = TOKEN_PROGRAM_ID;
  let storePda: PublicKey;
  let itemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;
  let orderAta: PublicKey;
  let taskQueueAcc: TaskQueueV0;
  let taskId: number;

  beforeEach(async () => {
    ({ litesvm, provider, tuktukProgram, taskQueuePda } = await getSetup(
      [admin, shopperAuthority, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(LAMPORTS_PER_SOL * 5),
        };
      }),
    ));

    await initTaskQueue(tuktukProgram, admin, taskQueuePda);
    taskQueueAcc = await fetchTaskQueueAcc(tuktukProgram, taskQueuePda);
    taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];

    initAta(litesvm, USDC_MINT, treasury);
    initAta(litesvm, USDC_MINT, shopperAuthority.publicKey, initShopperAtaBal);

    await sendTransaction(
      provider,

      [
        createInitializeConfigInstruction(
          { authority: admin.publicKey, systemProgram: SystemProgram.programId },
          {
            acceptedMints: [{ mint: USDC_MINT, priceUpdateV2: USDC_PRICE_UPDATE_V2 }],
            admin: admin.publicKey,
            orderFeeBps: 250,
          },
        ),
      ],

      [admin],
    );

    await sendTransaction(
      provider,

      [
        createInitializeShopperInstruction(
          { authority: shopperAuthority.publicKey, systemProgram: SystemProgram.programId },
          { name: "Shopper A", image: "https://example.com/image.png", address: "address" },
        ),
      ],

      [shopperAuthority],
    );

    await sendTransaction(
      provider,

      [
        createInitializeStoreInstruction(
          { authority: storeAuthority.publicKey, systemProgram: SystemProgram.programId },
          { name: "Store A", image: "https://example.com/image.png", about: "about" },
        ),
      ],

      [storeAuthority],
    );

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          { authority: storeAuthority.publicKey, systemProgram: SystemProgram.programId },
          {
            price: BigInt(itemPrice),
            inventoryCount: initInventoryCount,
            name: itemName,
            image: "https://example.com/item.png",
            description: "description",
          },
        ),
      ],

      [storeAuthority],
    );

    storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];
    shopperPda = findShopperPda({ authority: shopperAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const { unixTimestamp } = litesvm.getClock();
    orderPda = findOrderPda(
      { shopper: shopperPda, item: itemPda, timestamp: unixTimestamp },
      SPLURGE_PROGRAM_ID,
    )[0];

    await sendTransaction(
      provider,

      [
        createCreateOrderInstruction(
          {
            authority: shopperAuthority.publicKey,
            store: storePda,
            item: itemPda,
            order: orderPda,
            priceUpdateV2: USDC_PRICE_UPDATE_V2,
            paymentMint: USDC_MINT,
            authorityTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              shopperAuthority.publicKey,
              false,
              tokenProgram,
            ),
            treasuryTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              treasury,
              !PublicKey.isOnCurve(treasury),
              tokenProgram,
            ),
            orderTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              orderPda,
              true,
              tokenProgram,
            ),
            systemProgram: SystemProgram.programId,
            tokenProgram,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          },
          { amount: 1, timestamp: unixTimestamp },
        ),
      ],

      [shopperAuthority],
    );

    orderAta = getAssociatedTokenAddressSync(paymentMint, orderPda, !PublicKey.isOnCurve(orderPda));
    const [taskPda] = taskKey(taskQueuePda, taskId);
    const [taskQueueAuthorityPda] = taskQueueAuthorityKey(taskQueuePda, admin.publicKey);

    await sendTransaction(
      provider,

      [
        createShipOrderInstruction(
          {
            admin: admin.publicKey,
            order: orderPda,
            authority: shopperAuthority.publicKey,
            item: itemPda,
            orderTokenAccount: orderAta,
            paymentMint,
            shopper: shopperPda,
            store: storePda,
            storeTokenAccount: getAssociatedTokenAddressSync(
              paymentMint,
              storePda,
              true,
              tokenProgram,
            ),
            task: taskPda,
            taskQueue: taskQueuePda,
            taskQueueAuthority: taskQueueAuthorityPda,
            tokenProgram,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tuktuk: TUKTUK_PROGRAM_ID,
          },
          { taskId },
        ),
      ],

      [admin],
    );

    await sendTransaction(
      provider,

      [
        createCompleteOrderInstruction({
          admin: admin.publicKey,
          authority: shopperAuthority.publicKey,
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          paymentMint,
          orderTokenAccount: orderAta,
          storeTokenAccount: getAssociatedTokenAddressSync(
            paymentMint,
            storePda,
            true,
            tokenProgram,
          ),
          tokenProgram,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        }),
      ],

      [admin],
    );
  });

  test("withdraw earnings", async () => {
    const storeUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, storePda, true, tokenProgram);
    const preStoreUsdcAtaAcc = await getAccount(provider.connection, storeUsdcAta);

    await sendTransaction(
      provider,

      [
        createWithdrawEarningsInstruction({
          authority: storeAuthority.publicKey,
          store: storePda,
          paymentMint: USDC_MINT,
          storeTokenAccount: storeUsdcAta,
          authorityTokenAccount: getAssociatedTokenAddressSync(
            USDC_MINT,
            storeAuthority.publicKey,
            false,
            tokenProgram,
          ),
          tokenProgram,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        }),
      ],

      [storeAuthority],
    );

    const storeAuthorityUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storeAuthority.publicKey,
      false,
      tokenProgram,
    );
    const storeAuthorityUsdcAtaAcc = await getAccount(provider.connection, storeAuthorityUsdcAta);

    expect(Number(storeAuthorityUsdcAtaAcc.amount)).toBe(Number(preStoreUsdcAtaAcc.amount));

    const postStoreUsdcAtaAcc = await getAccount(provider.connection, storeUsdcAta, "processed");

    expect(postStoreUsdcAtaAcc.amount).toBe(0n);
  });

  test("throws if withdrawing as unauthorized store authority", async () => {
    try {
      await sendTransaction(
        provider,

        [
          createWithdrawEarningsInstruction({
            authority: storeAuthority.publicKey,
            store: storePda,
            paymentMint: USDC_MINT,
            storeTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              storePda,
              true,
              tokenProgram,
            ),
            authorityTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              storeAuthority.publicKey,
              false,
              tokenProgram,
            ),
            tokenProgram,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          }),
        ],

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "UnauthorizedStoreAuthority");
    }
  });
});
