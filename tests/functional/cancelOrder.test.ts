import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from "@helium/tuktuk-sdk";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
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
import { LiteSVMProvider } from "anchor-litesvm";
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

describe("cancelOrder", () => {
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
            paymentMint,
            authorityTokenAccount: getAssociatedTokenAddressSync(
              paymentMint,
              shopperAuthority.publicKey,
              false,
            ),
            treasuryTokenAccount: getAssociatedTokenAddressSync(
              paymentMint,
              treasury,
              !PublicKey.isOnCurve(treasury),
            ),
            orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
          },
          { amount: 1, timestamp: unixTimestamp },
        ),
      ],

      [shopperAuthority],
    );

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
  });

  test("cancels an order", async () => {
    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      !PublicKey.isOnCurve(orderPda),
    );
    const preOrderAtaRent = litesvm.getBalance(orderAta);
    const preShopperAuthorityBal = litesvm.getBalance(shopperAuthority.publicKey);
    const shopperAuthorityAta = getAssociatedTokenAddressSync(
      paymentMint,
      shopperAuthority.publicKey,
      !PublicKey.isOnCurve(shopperAuthority.publicKey),
    );
    const preShopperAuthorityAta = await getAccount(provider.connection, shopperAuthorityAta);
    const treasuryAta = getAssociatedTokenAddressSync(
      paymentMint,
      treasury,
      !PublicKey.isOnCurve(treasury),
    );
    const preTreasuryAta = await getAccount(provider.connection, treasuryAta);

    await sendTransaction(
      provider,

      [
        createCancelOrderInstruction({
          admin: admin.publicKey,
          authority: shopperAuthority.publicKey,
          order: orderPda,
          paymentMint,
          shopper: shopperPda,
          treasuryTokenAccount: treasuryAta,
          orderTokenAccount: orderAta,
          authorityTokenAccount: shopperAuthorityAta,
        }),
      ],

      [admin],
    );

    const orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

    expect(orderAcc.status).toBe(2);

    const postShopperAuthorityBal = litesvm.getBalance(shopperAuthority.publicKey);

    expect(preShopperAuthorityBal).toBe(postShopperAuthorityBal - preOrderAtaRent);

    const postShopperAuthorityAta = await getAccount(provider.connection, shopperAuthorityAta);

    expect(Number(preShopperAuthorityAta.amount)).toBe(
      Number(postShopperAuthorityAta.amount) -
        Number(orderAcc.paymentSubtotal) -
        Number(orderAcc.platformFee),
    );

    const postOrderAtaRent = litesvm.getBalance(orderAta);

    expect(postOrderAtaRent).toBe(null);

    const postTreasuryAta = await getAccount(provider.connection, treasuryAta);

    expect(Number(preTreasuryAta.amount)).toBe(
      Number(postTreasuryAta.amount) + Number(orderAcc.platformFee),
    );
  });

  test("throws if cancelling as unauthorized admin", async () => {
    try {
      await sendTransaction(
        provider,

        [
          createCancelOrderInstruction({
            admin: storeAuthority.publicKey,
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

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "UnauthorizedAdmin");
    }
  });
});
