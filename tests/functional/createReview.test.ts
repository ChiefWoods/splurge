import { beforeAll, describe, expect, test } from "bun:test";
import {
  completeOrder,
  createItem,
  createOrder,
  createReview,
  createShopper,
  createStore,
  getBankrunSetup,
  getOrderPdaAndBump,
  getReviewPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
  initializeConfig,
  updateOrder,
} from "../utils";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, BN, Program } from "@coral-xyz/anchor";

describe("createReview", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const walletA = Keypair.generate();
  let walletAUsdcAta: PublicKey;

  const usdcMint = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  );

  let usdcDecimals: number;

  let usdcMintOwner: PublicKey;

  beforeAll(async () => {
    const connection = new Connection("https://api.devnet.solana.com");

    const usdcAccInfo = await connection.getAccountInfo(usdcMint);
    usdcMintOwner = usdcAccInfo.owner;

    walletAUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      walletA.publicKey,
      true,
    );
    const usdcAtaData = Buffer.alloc(ACCOUNT_SIZE);

    AccountLayout.encode(
      {
        mint: usdcMint,
        owner: walletA.publicKey,
        amount: 100_000_000n,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      usdcAtaData,
    );

    const bankrunSetup = await getBankrunSetup([
      {
        address: walletA.publicKey,
        info: {
          data: Buffer.alloc(0),
          executable: false,
          lamports: 5_000_000_000,
          owner: SystemProgram.programId,
        },
      },
      {
        address: usdcMint,
        info: usdcAccInfo,
      },
      {
        address: walletAUsdcAta,
        info: {
          lamports: 1_000_000_000,
          data: usdcAtaData,
          owner: usdcMintOwner,
          executable: false,
        },
      },
    ]);

    context = bankrunSetup.context;
    banksClient = bankrunSetup.banksClient;
    payer = bankrunSetup.payer;
    provider = bankrunSetup.provider;
    program = bankrunSetup.program;

    usdcDecimals = await getMint(provider.connection, usdcMint).then(
      (mint) => mint.decimals,
    );

    await initializeConfig(program, payer, [usdcMint]);

    await createStore(
      program,
      "Store A",
      "https://example.com/image.png",
      "This is a description",
      payer,
    );

    await createShopper(
      program,
      "Shopper A",
      "https://example.com/image.png",
      "This is an address",
      walletA,
    );
  });

  test("create review", async () => {
    const storeItemName = "Store Item A";
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      10,
      price,
      payer,
    );

    const timestamp = Date.now();
    const amount = 2;
    const paymentMint = usdcMint;
    const totalUsd = price * amount;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp),
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    const admin = payer;

    await completeOrder(
      program,
      timestamp,
      admin,
      shopperPda,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
    );

    const text = "This is a review";
    const rating = 3;

    const { reviewAcc, storeItemAcc } = await createReview(
      program,
      text,
      rating,
      walletA,
      storeItemPda,
      orderPda,
    );

    const [reviewPda, reviewBump] = getReviewPdaAndBump(orderPda);

    expect(reviewAcc.bump).toEqual(reviewBump);
    expect(reviewAcc.rating).toEqual(rating);
    expect(reviewAcc.order).toEqual(orderPda);
    expect(reviewAcc.text).toEqual(text);
    expect(storeItemAcc.reviews[0]).toEqual(reviewPda);
  });

  test("throws if order is not completed", async () => {
    const storeItemName = "Store Item B";
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      10,
      price,
      payer,
    );

    const timestamp = Date.now();
    const amount = 2;
    const paymentMint = usdcMint;
    const totalUsd = price * amount;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp),
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    const admin = payer;

    const text = "This is a review";
    const rating = 3;

    try {
      await createReview(
        program,
        text,
        rating,
        walletA,
        storeItemPda,
        orderPda,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("OrderNotCompleted");
      expect(err.error.errorCode.number).toEqual(6500);
    }
  });

  test("throws if rating is invalid", async () => {
    const storeItemName = "Store Item C";
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      10,
      price,
      payer,
    );

    const timestamp = Date.now();
    const amount = 2;
    const paymentMint = usdcMint;
    const totalUsd = price * amount;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp),
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    const admin = payer;

    await completeOrder(
      program,
      timestamp,
      admin,
      shopperPda,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
    );

    const text = "This is a review";
    const rating = 0;

    try {
      await createReview(
        program,
        text,
        rating,
        walletA,
        storeItemPda,
        orderPda,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("ReviewRatingInvalid");
      expect(err.error.errorCode.number).toEqual(6501);
    }
  });

  test("throws if review for order already exists", async () => {
    const storeItemName = "Store Item D";
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      10,
      price,
      payer,
    );

    const timestamp = Date.now();
    const amount = 2;
    const paymentMint = usdcMint;
    const totalUsd = price * amount;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp),
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    const admin = payer;

    await completeOrder(
      program,
      timestamp,
      admin,
      shopperPda,
      storePda,
      storeItemPda,
      paymentMint,
      usdcMintOwner,
    );

    const text = "This is a review";
    const rating = 3;

    await createReview(program, text, rating, walletA, storeItemPda, orderPda);

    const newText = "This is another review";
    const newRating = 4;

    expect(async () => {
      await createReview(
        program,
        newText,
        newRating,
        walletA,
        storeItemPda,
        orderPda,
      );
    }).toThrow();
  });
});
