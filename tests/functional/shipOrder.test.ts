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
  createCancelOrderInstruction,
  createCreateOrderInstruction,
  createInitializeConfigInstruction,
  createInitializeShopperInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createShipOrderInstruction,
  fetchOrderAccount,
  findItemPda,
  findOrderPda,
  findShopperPda,
  findStorePda,
  findTreasuryPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVM } from "litesvm";

import { TUKTUK_PROGRAM_ID } from "../../common/tuktuk";
import { fetchTaskQueueAcc } from "../accounts";
import { USDC_MINT, USDC_PRICE_UPDATE_V2, USDT_MINT } from "../constants";
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
  initTaskQueue,
  sendTransaction,
} from "../setup";

describe("shipOrder", () => {
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
  let orderPda: PublicKey;
  let taskQueueAcc: TaskQueueV0;
  let taskId: number;

  const shopperPda = findShopperPda(
    { authority: shopperAuthority.publicKey },
    SPLURGE_PROGRAM_ID,
  )[0];
  const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
  const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];

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
    initAta(litesvm, USDT_MINT, treasury);
    initAta(litesvm, USDT_MINT, shopperAuthority.publicKey, initShopperAtaBal);

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
  });

  test("updates an order", async () => {
    const paymentMint = USDC_MINT;
    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      !PublicKey.isOnCurve(orderPda),
    );
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

    const orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

    expect(orderAcc.status).toBe(1);
  });

  test("throws if updating finalized order", async () => {
    const paymentMint = USDC_MINT;

    await sendTransaction(
      provider,

      [
        createCancelOrderInstruction({
          admin: admin.publicKey,
          authority: shopperAuthority.publicKey,
          order: orderPda,
          paymentMint,
          shopper: shopperPda,
          treasuryTokenAccount: getAssociatedTokenAddressSync(
            paymentMint,
            treasury,
            !PublicKey.isOnCurve(treasury),
          ),
          orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
          authorityTokenAccount: getAssociatedTokenAddressSync(
            paymentMint,
            shopperAuthority.publicKey,
            false,
          ),
        }),
      ],

      [admin],
    );

    expect(async () => {
      const orderAta = getAssociatedTokenAddressSync(
        paymentMint,
        orderPda,
        !PublicKey.isOnCurve(orderPda),
      );
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
    }).toThrow();
  });

  test("throws if updating as unauthorized admin", async () => {
    try {
      const paymentMint = USDC_MINT;
      const orderAta = getAssociatedTokenAddressSync(
        paymentMint,
        orderPda,
        !PublicKey.isOnCurve(orderPda),
      );
      const [taskPda] = taskKey(taskQueuePda, taskId);
      const [taskQueueAuthorityPda] = taskQueueAuthorityKey(taskQueuePda, admin.publicKey);

      await sendTransaction(
        provider,

        [
          createShipOrderInstruction(
            {
              admin: shopperAuthority.publicKey,
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

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "UnauthorizedAdmin");
    }
  });
});
