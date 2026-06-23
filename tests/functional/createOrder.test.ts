import { beforeEach, describe, expect, test } from "bun:test";

import {
  getAccount,
  getAssociatedTokenAddressSync,
  MAX_FEE_BASIS_POINTS,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createCreateOrderInstruction,
  createInitializeConfigInstruction,
  createInitializeShopperInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createUpdateConfigInstruction,
  fetchConfigAccount,
  fetchItemAccount,
  fetchOrderAccount,
  findConfigPda,
  findItemPda,
  findOrderPda,
  findShopperPda,
  findStorePda,
  findTreasuryPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";
import { LiteSVM } from "litesvm";

import {
  MINT_DECIMALS,
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
  USDT_MINT,
  USDT_PRICE_UPDATE_V2,
} from "../constants";
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
  sendTransaction,
} from "../setup";

describe("createOrder", () => {
  let { litesvm, provider, connection } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const [admin, shopperAuthority, storeAuthority] = Array.from({ length: 3 }, Keypair.generate);
  const treasury = findTreasuryPda(SPLURGE_PROGRAM_ID)[0];

  const itemName = "Item A";
  const itemPrice = 1e6; // $1
  const initInventoryCount = 10;

  const shopperAuthorityUsdcAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    shopperAuthority.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  );
  const initShopperAtaBal = 1e8; // $100

  beforeEach(async () => {
    ({ litesvm, provider, connection } = await getSetup(
      [admin, shopperAuthority, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ));

    initAta(litesvm, USDC_MINT, treasury);
    initAta(litesvm, USDC_MINT, shopperAuthority.publicKey, initShopperAtaBal);
    initAta(litesvm, USDT_MINT, treasury);
    initAta(litesvm, USDT_MINT, shopperAuthority.publicKey, initShopperAtaBal);

    await sendTransaction(
      provider,

      [
        createInitializeConfigInstruction(
          {
            authority: admin.publicKey,
          },
          {
            acceptedMints: [
              {
                mint: USDC_MINT,
                priceUpdateV2: USDC_PRICE_UPDATE_V2,
              },
            ],
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
          {
            authority: shopperAuthority.publicKey,
          },
          {
            name: "Shopper A",
            image: "https://example.com/image.png",
            address: "address",
          },
        ),
      ],

      [shopperAuthority],
    );

    await sendTransaction(
      provider,

      [
        createInitializeStoreInstruction(
          {
            authority: storeAuthority.publicKey,
          },
          {
            name: "Store A",
            image: "https://example.com/image.png",
            about: "about",
          },
        ),
      ],

      [storeAuthority],
    );

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          {
            authority: storeAuthority.publicKey,
          },
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
  });

  test("creates an order", async () => {
    const treasuryAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      treasury,
      !PublicKey.isOnCurve(treasury),
    );
    const initTreasuryAtaBal = (await getAccount(provider.connection, treasuryAta)).amount;

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];
    const shopperPda = findShopperPda(
      { authority: shopperAuthority.publicKey },
      SPLURGE_PROGRAM_ID,
    )[0];
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = findOrderPda(
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
            authorityTokenAccount: shopperAuthorityUsdcAta,
            treasuryTokenAccount: treasuryAta,
            orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
          },
          {
            amount,
            timestamp: unixTimestamp,
          },
        ),
      ],

      [shopperAuthority],
    );

    const orderAcc = (await fetchOrderAccount(connection, orderPda)).data;

    expect(orderAcc.shopper).toStrictEqual(shopperPda);
    expect(orderAcc.item).toStrictEqual(itemPda);
    expect(orderAcc.timestamp).toBe(unixTimestamp);
    expect(orderAcc.status).toBe(0);
    expect(orderAcc.amount).toBe(amount);
    expect(Number(orderAcc.paymentSubtotal)).toBeCloseTo(itemPrice * amount, -MINT_DECIMALS);
    expect(orderAcc.paymentMint).toStrictEqual(paymentMint);

    const postShopperUsdcAtaBal = (await getAccount(provider.connection, shopperAuthorityUsdcAta))
      .amount;

    const orderAta = getAssociatedTokenAddressSync(paymentMint, orderPda, true, TOKEN_PROGRAM_ID);
    const orderAtaBal = (await getAccount(provider.connection, orderAta)).amount;

    expect(initShopperAtaBal).toBeCloseTo(
      Number(postShopperUsdcAtaBal + orderAtaBal),
      -MINT_DECIMALS,
    );

    const configPda = findConfigPda(SPLURGE_PROGRAM_ID)[0];
    const { orderFeeBps } = (await fetchConfigAccount(connection, configPda)).data;

    const postTreasuryAtaBal = (await getAccount(provider.connection, treasuryAta)).amount;
    const platformFee = Math.ceil((Number(orderAtaBal) * orderFeeBps) / MAX_FEE_BASIS_POINTS);

    expect(Number(initTreasuryAtaBal)).toBeCloseTo(Number(postTreasuryAtaBal) - platformFee);

    const itemAcc = (await fetchItemAccount(connection, itemPda)).data;

    expect(initInventoryCount).toBe(itemAcc.inventoryCount + amount);
  });

  test("throws if payment mint is not accepted", async () => {
    const amount = 1;
    const paymentMint = USDT_MINT;

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];
    const shopperPda = findShopperPda(
      { authority: shopperAuthority.publicKey },
      SPLURGE_PROGRAM_ID,
    )[0];
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = findOrderPda(
      { shopper: shopperPda, item: itemPda, timestamp: unixTimestamp },
      SPLURGE_PROGRAM_ID,
    )[0];

    try {
      await sendTransaction(
        provider,

        [
          createCreateOrderInstruction(
            {
              authority: shopperAuthority.publicKey,
              store: storePda,
              item: itemPda,
              priceUpdateV2: USDT_PRICE_UPDATE_V2,
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
            {
              amount,
              timestamp: unixTimestamp,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "PaymentMintNotAccepted");
    }
  });

  test("throws if platform is locked", async () => {
    await sendTransaction(
      provider,

      [
        createUpdateConfigInstruction(
          {
            admin: admin.publicKey,
          },
          {
            acceptedMints: null,
            isPaused: true,
            newAdmin: null,
            orderFeeBps: null,
          },
        ),
      ],

      [admin],
    );

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];
    const shopperPda = findShopperPda(
      { authority: shopperAuthority.publicKey },
      SPLURGE_PROGRAM_ID,
    )[0];
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = findOrderPda(
      { shopper: shopperPda, item: itemPda, timestamp: unixTimestamp },
      SPLURGE_PROGRAM_ID,
    )[0];

    try {
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
              authorityTokenAccount: shopperAuthorityUsdcAta,
              treasuryTokenAccount: getAssociatedTokenAddressSync(
                paymentMint,
                treasury,
                !PublicKey.isOnCurve(treasury),
              ),
              orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
            },
            {
              amount,
              timestamp: unixTimestamp,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "PlatformPaused");
    }
  });

  test("throws if item has insufficient inventory", async () => {
    const itemName = "Item B";

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          {
            authority: storeAuthority.publicKey,
          },
          {
            price: BigInt(itemPrice),
            inventoryCount: 0,
            name: itemName,
            image: "https://example.com/item.png",
            description: "description",
          },
        ),
      ],

      [storeAuthority],
    );

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];
    const shopperPda = findShopperPda(
      { authority: shopperAuthority.publicKey },
      SPLURGE_PROGRAM_ID,
    )[0];
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = findOrderPda(
      { shopper: shopperPda, item: itemPda, timestamp: unixTimestamp },
      SPLURGE_PROGRAM_ID,
    )[0];

    try {
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
              authorityTokenAccount: shopperAuthorityUsdcAta,
              treasuryTokenAccount: getAssociatedTokenAddressSync(
                paymentMint,
                treasury,
                !PublicKey.isOnCurve(treasury),
              ),
              orderTokenAccount: getAssociatedTokenAddressSync(paymentMint, orderPda, true),
            },
            {
              amount,
              timestamp: unixTimestamp,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "InsufficientInventory");
    }
  });
});
