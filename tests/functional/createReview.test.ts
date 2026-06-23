import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from "@helium/tuktuk-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createCompleteOrderInstruction,
  createCreateOrderInstruction,
  createCreateReviewInstruction,
  createInitializeConfigInstruction,
  createInitializeShopperInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createShipOrderInstruction,
  fetchReviewAccount,
  findItemPda,
  findOrderPda,
  findReviewPda,
  findShopperPda,
  findStorePda,
  findTreasuryPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
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

describe("createReview", () => {
  let { litesvm, provider, connection, tuktukProgram, taskQueuePda } = {} as {
    litesvm: LiteSVM;
    provider: Awaited<ReturnType<typeof getSetup>>["provider"];
    connection: Awaited<ReturnType<typeof getSetup>>["connection"];
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
  let storePda: PublicKey;
  let itemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;
  let orderAta: PublicKey;
  let taskQueueAcc: TaskQueueV0;
  let taskId: number;

  beforeEach(async () => {
    ({ litesvm, provider, connection, tuktukProgram, taskQueuePda } = await getSetup(
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
          { authority: admin.publicKey },
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
          { authority: shopperAuthority.publicKey },
          { name: "Shopper A", image: "https://example.com/image.png", address: "address" },
        ),
      ],

      [shopperAuthority],
    );

    await sendTransaction(
      provider,

      [
        createInitializeStoreInstruction(
          { authority: storeAuthority.publicKey },
          { name: "Store A", image: "https://example.com/image.png", about: "about" },
        ),
      ],

      [storeAuthority],
    );

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          { authority: storeAuthority.publicKey },
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
            priceUpdateV2: USDC_PRICE_UPDATE_V2,
            paymentMint: USDC_MINT,
            authorityTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              shopperAuthority.publicKey,
              false,
            ),
            treasuryTokenAccount: getAssociatedTokenAddressSync(
              USDC_MINT,
              treasury,
              !PublicKey.isOnCurve(treasury),
            ),
            orderTokenAccount: getAssociatedTokenAddressSync(USDC_MINT, orderPda, true),
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
            storeTokenAccount: getAssociatedTokenAddressSync(paymentMint, storePda, true),
            task: taskPda,
            taskQueue: taskQueuePda,
            taskQueueAuthority: taskQueueAuthorityPda,
            tuktuk: TUKTUK_PROGRAM_ID,
          },
          { taskId },
        ),
      ],

      [admin],
    );
  });

  test("create review", async () => {
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
          storeTokenAccount: getAssociatedTokenAddressSync(paymentMint, storePda, true),
        }),
      ],

      [admin],
    );

    const { unixTimestamp } = litesvm.getClock();

    const text = "review";
    const rating = 3;

    await sendTransaction(
      provider,

      [
        createCreateReviewInstruction(
          {
            authority: shopperAuthority.publicKey,
            order: orderPda,
          },
          {
            text,
            rating,
          },
        ),
      ],

      [shopperAuthority],
    );

    const reviewPda = findReviewPda({ order: orderPda }, SPLURGE_PROGRAM_ID)[0];
    const reviewAcc = (await fetchReviewAccount(connection, reviewPda)).data;

    expect(reviewAcc.order).toStrictEqual(orderPda);
    expect(reviewAcc.rating).toBe(rating);
    expect(reviewAcc.timestamp).toBe(unixTimestamp);
    expect(reviewAcc.text).toBe(text);
  });

  test("throws if order is not completed", async () => {
    const text = "review";
    const rating = 3;

    try {
      await sendTransaction(
        provider,

        [
          createCreateReviewInstruction(
            {
              authority: shopperAuthority.publicKey,
              order: orderPda,
            },
            {
              text,
              rating,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "OrderNotCompleted");
    }
  });

  test("throws if rating is invalid", async () => {
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
          orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
          storeTokenAccount: getAssociatedTokenAddressSync(paymentMint, storePda, true),
        }),
      ],

      [admin],
    );

    const text = "This is a review";
    const rating = 0;

    try {
      await sendTransaction(
        provider,

        [
          createCreateReviewInstruction(
            {
              authority: shopperAuthority.publicKey,
              order: orderPda,
            },
            {
              text,
              rating,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "InvalidRating");
    }
  });

  test("throws if review for order already exists", async () => {
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
          orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
          storeTokenAccount: getAssociatedTokenAddressSync(paymentMint, storePda, true),
        }),
      ],

      [admin],
    );

    const text = "This is a review";
    const rating = 3;

    await sendTransaction(
      provider,

      [
        createCreateReviewInstruction(
          {
            authority: shopperAuthority.publicKey,
            order: orderPda,
          },
          {
            text,
            rating,
          },
        ),
      ],

      [shopperAuthority],
    );

    const newText = "This is another review";
    const newRating = 4;

    expect(async () => {
      await sendTransaction(
        provider,

        [
          createCreateReviewInstruction(
            {
              authority: shopperAuthority.publicKey,
              shopper: shopperPda,
              order: orderPda,
            },
            {
              text: newText,
              rating: newRating,
            },
          ),
        ],

        [shopperAuthority],
      );
    }).toThrow();
  });
});
