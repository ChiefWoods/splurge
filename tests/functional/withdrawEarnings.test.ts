import { beforeAll, describe, expect, test } from "bun:test";
import {
  completeOrder,
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
  withdrawEarnings,
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
import { BN, Program } from "@coral-xyz/anchor";

describe("withdrawEarnings", () => {
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

  test("withdraw earnings", async () => {
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
    const paymentMintOwner = usdcMintOwner;
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
      paymentMintOwner,
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
      paymentMintOwner,
    );

    await withdrawEarnings(
      program,
      payer,
      payer,
      paymentMint,
      paymentMintOwner,
    );

    const authorityTokenAcc = await getAccount(
      provider.connection,
      getAssociatedTokenAddressSync(
        paymentMint,
        payer.publicKey,
        false,
        paymentMintOwner,
      ),
    );

    const storeTokenAcc = await banksClient.getAccount(
      getAssociatedTokenAddressSync(
        paymentMint,
        storePda,
        true,
        paymentMintOwner,
      ),
    );

    expect(Number(authorityTokenAcc.amount) / 10 ** usdcDecimals).toEqual(
      totalUsd,
    );
    expect(storeTokenAcc).toBeNull();
  });
});
