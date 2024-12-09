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
  updateOrder,
} from "../utils";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, BN, Program } from "@coral-xyz/anchor";

describe("updateOrder", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const walletA = Keypair.generate();
  const walletAUsdcInitBal = 100_000_000n;
  let walletAUsdcAta: PublicKey;
  const usdcMint = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  );
  let usdcMintOwner: PublicKey;

  let storePda: PublicKey;
  const [shopperPda] = getShopperPdaAndBump(walletA.publicKey);
  const timestamp = Date.now();

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

    [storePda] = getStorePdaAndBump(payer.publicKey);

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

  test("update order", async () => {
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

    const amount = 2;
    const totalUsd = price * amount;
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    const status = { shipping: {} };

    const { orderAcc } = await updateOrder(
      program,
      status,
      getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
      payer,
    );

    expect(orderAcc.status).toEqual(status);
  });

  test("throws if updating finalized order", async () => {
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

    const amount = 2;
    const totalUsd = price * amount;
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    await updateOrder(
      program,
      { shipping: {} },
      getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
      payer,
    );

    await updateOrder(
      program,
      { cancelled: {} },
      getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
      payer,
    );

    try {
      await updateOrder(
        program,
        { completed: {} },
        getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
        payer,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("OrderAlreadyFinalized");
      expect(err.error.errorCode.number).toEqual(6405);
    }
  });

  test("throws if updating as unauthorized admin", async () => {
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

    const amount = 2;
    const totalUsd = price * amount;
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner,
      walletA,
      payer,
    );

    try {
      await updateOrder(
        program,
        { shipping: {} },
        getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
        walletA,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("UnauthorizedAdmin");
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
