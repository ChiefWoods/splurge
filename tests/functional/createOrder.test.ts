import { beforeAll, describe, expect, test } from "bun:test";
import {
  createItem,
  createOrder,
  createShopper,
  createStore,
  getBankrunSetup,
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
  initializeConfig,
} from "../utils";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, BN, Program } from "@coral-xyz/anchor";

describe("createOrder", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const walletA = Keypair.generate();
  let walletAUsdcAta: PublicKey;
  let walletAPyusdAta: PublicKey;
  const walletAUsdcInitBal = 100_000_000n;

  const storeItemName = "Store Item A";
  const inventoryCountInit = 10;
  const price = 5.55;
  const usdcMint = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  );
  const pyusdMint = new PublicKey(
    "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM",
  );

  let usdcDecimals: number;
  let usdcMintOwner: PublicKey;
  let pyusdMintOwner: PublicKey;

  beforeAll(async () => {
    const connection = new Connection("https://api.devnet.solana.com");

    const usdcAccInfo = await connection.getAccountInfo(usdcMint);
    const pyusdAccInfo = await connection.getAccountInfo(pyusdMint);
    usdcMintOwner = usdcAccInfo.owner;
    pyusdMintOwner = pyusdAccInfo.owner;

    walletAUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      walletA.publicKey,
      true,
      usdcMintOwner,
    );
    const usdcAtaData = Buffer.alloc(ACCOUNT_SIZE);

    AccountLayout.encode(
      {
        mint: usdcMint,
        owner: walletA.publicKey,
        amount: walletAUsdcInitBal,
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

    walletAPyusdAta = getAssociatedTokenAddressSync(
      pyusdMint,
      walletA.publicKey,
      true,
      pyusdMintOwner,
    );
    const pyusdAtaData = Buffer.alloc(ACCOUNT_SIZE);

    AccountLayout.encode(
      {
        mint: pyusdMint,
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
      pyusdAtaData,
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
        address: pyusdMint,
        info: pyusdAccInfo,
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
      {
        address: walletAPyusdAta,
        info: {
          lamports: 1_000_000_000,
          data: pyusdAtaData,
          owner: pyusdMintOwner,
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

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      inventoryCountInit,
      price,
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

  test("create order", async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);
    const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);

    const { shopperAcc, storeItemAcc, orderAcc } = await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      paymentMintOwner,
      walletA,
    );

    const [orderPda, orderBump] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp),
    );

    const walletAUsdcPostBal = await getAccount(
      provider.connection,
      walletAUsdcAta,
    ).then((acc) => acc.amount);
    const orderTokenAcc = await getAccount(
      provider.connection,
      getAssociatedTokenAddressSync(paymentMint, orderPda, true, usdcMintOwner),
    );

    expect(orderAcc.bump).toEqual(orderBump);
    expect(orderAcc.status).toEqual({ pending: {} });
    expect(orderAcc.timestamp.toNumber()).toEqual(timestamp);
    expect(orderAcc.amount.toNumber()).toEqual(amount);
    expect(orderAcc.totalUsd).toEqual(totalUsd);
    expect(orderAcc.paymentMint).toEqual(paymentMint);
    expect(orderAcc.shopper).toEqual(shopperPda);
    expect(orderAcc.storeItem).toEqual(storeItemPda);
    expect(shopperAcc.orders[0]).toEqual(orderPda);

    expect(storeItemAcc.inventoryCount.toNumber()).toEqual(
      inventoryCountInit - amount,
    );
    expect(Number(orderTokenAcc.amount) / 10 ** usdcDecimals).toEqual(totalUsd);
    expect(Number(walletAUsdcPostBal)).toEqual(
      Number(walletAUsdcInitBal) - Number(orderTokenAcc.amount),
    );
  });

  test("throws if payment mint is not whitelisted", async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = pyusdMint;
    const paymentMintOwner = pyusdMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    try {
      await createOrder(
        program,
        timestamp,
        amount,
        totalUsd,
        storePda,
        storeItemPda,
        paymentMint,
        paymentMintOwner,
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("PaymentMintNotWhitelisted");
      expect(err.error.errorCode.number).toEqual(6400);
    }
  });

  test("throws if amount is less than 0", async () => {
    const timestamp = Date.now();
    const amount = -1;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    try {
      await createOrder(
        program,
        timestamp,
        amount,
        totalUsd,
        storePda,
        storeItemPda,
        paymentMint,
        paymentMintOwner,
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("OrderAmountInvalid");
      expect(err.error.errorCode.number).toEqual(6401);
    }
  });

  test("throws if total USD is less than 0", async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = -1;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    try {
      await createOrder(
        program,
        timestamp,
        amount,
        totalUsd,
        storePda,
        storeItemPda,
        paymentMint,
        paymentMintOwner,
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("OrderTotalInvalid");
      expect(err.error.errorCode.number).toEqual(6402);
    }
  });

  test("throws if total USD is incorrect", async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * (amount + 1);
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    try {
      await createOrder(
        program,
        timestamp,
        amount,
        totalUsd,
        storePda,
        storeItemPda,
        paymentMint,
        paymentMintOwner,
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("OrderTotalIncorrect");
      expect(err.error.errorCode.number).toEqual(6403);
    }
  });

  test("throws if store item has insufficient inventory", async () => {
    const storeItemName = "Store Item B";
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      "https://example.com/item.png",
      "This is a description",
      0,
      price,
      payer,
    );

    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    try {
      await createOrder(
        program,
        timestamp,
        amount,
        totalUsd,
        storePda,
        storeItemPda,
        paymentMint,
        paymentMintOwner,
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("InsufficientInventory");
      expect(err.error.errorCode.number).toEqual(6404);
    }
  });
});
