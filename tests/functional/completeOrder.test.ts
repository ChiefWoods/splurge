import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from "@helium/tuktuk-sdk";
import { getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createCompleteOrderInstruction,
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

describe("completeOrder", () => {
  let { litesvm, provider, connection, tuktukProgram, taskQueuePda } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
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

  test("complete order", async () => {
    let orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

    const orderAta = getAssociatedTokenAddressSync(paymentMint, orderPda, true, TOKEN_PROGRAM_ID);
    const orderAtaAcc = await getAccount(provider.connection, orderAta);

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

    orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

    expect(orderAcc.status).toBe(3);

    const storeUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, storePda, true, TOKEN_PROGRAM_ID);
    const storeUsdcAtaAcc = await getAccount(provider.connection, storeUsdcAta);

    expect(storeUsdcAtaAcc.amount).toBe(orderAtaAcc.amount);

    const orderAtaRent = litesvm.getBalance(orderAta);

    expect(orderAtaRent).toBe(null);
  });

  test("throws if order status is not shipping", async () => {
    const clock = litesvm.getClock();
    const newTimestamp = clock.unixTimestamp + 60n;
    clock.unixTimestamp = newTimestamp;
    litesvm.setClock(clock);

    const orderPda = findOrderPda(
      { shopper: shopperPda, item: itemPda, timestamp: newTimestamp },
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
          { amount: 1, timestamp: newTimestamp },
        ),
      ],

      [shopperAuthority],
    );

    try {
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
    } catch (err) {
      await expectAnchorError(err, "OrderNotBeingShipped");
    }
  });

  test("throws if order is already completed", async () => {
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

    expect(async () => {
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
    }).toThrow();
  });

  test("throws if signed by unauthorized admin", async () => {
    try {
      await sendTransaction(
        provider,

        [
          createCompleteOrderInstruction({
            admin: shopperAuthority.publicKey,
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

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "UnauthorizedAdmin");
    }
  });
});
