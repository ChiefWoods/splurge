import { beforeEach, describe, expect, test } from 'bun:test';
import {
  completeOrder,
  createItem,
  createOrder,
  createReview,
  createShopper,
  createStore,
  initializeConfig,
  updateOrder,
} from '../methods';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import {
  getOrderPdaAndBump,
  getReviewPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from '../pda';

describe('createReview', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const storeWallet = Keypair.generate();
  const shopperWallet = Keypair.generate();
  const usdcMint = new PublicKey(
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  );
  const timestamp = Date.now();
  const storeItemName = 'Store Item B';
  const price = 5.55;

  let shopperUsdcAta: PublicKey;
  let usdcMintOwner: PublicKey;
  let totalUsd: number;
  let storePda: PublicKey;
  let storeItemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;

  beforeEach(async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const usdcAccInfo = await connection.getAccountInfo(usdcMint);
    usdcMintOwner = usdcAccInfo.owner;

    shopperUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      shopperWallet.publicKey,
      true,
      usdcMintOwner
    );

    const usdcAtaData = Buffer.alloc(ACCOUNT_SIZE);

    AccountLayout.encode(
      {
        mint: usdcMint,
        owner: shopperWallet.publicKey,
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
      usdcAtaData
    );

    ({ context, banksClient, payer, provider, program } = await getBankrunSetup(
      [
        {
          address: storeWallet.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: 5_000_000_000,
            owner: SystemProgram.programId,
          },
        },
        {
          address: shopperWallet.publicKey,
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
          address: shopperUsdcAta,
          info: {
            lamports: 1_000_000_000,
            data: usdcAtaData,
            owner: usdcMintOwner,
            executable: false,
          },
        },
      ]
    ));

    await initializeConfig(program, payer, [usdcMint]);

    await createStore(
      program,
      'Store A',
      'https://example.com/image.png',
      'This is a description',
      storeWallet
    );

    await createItem(
      program,
      storeItemName,
      'https://example.com/item.png',
      'This is a description',
      10,
      price,
      storeWallet
    );

    await createShopper(
      program,
      'Shopper A',
      'https://example.com/image.png',
      'This is an address',
      shopperWallet
    );

    const amount = 2;
    totalUsd = price * amount;
    [storePda] = getStorePdaAndBump(storeWallet.publicKey);
    [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner,
      shopperWallet,
      payer
    );

    [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
    [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    await completeOrder(
      program,
      timestamp,
      payer,
      shopperPda,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner
    );
  });

  test('create review', async () => {
    const text = 'This is a review';
    const rating = 3;

    const { reviewAcc, storeItemAcc } = await createReview(
      program,
      text,
      rating,
      shopperWallet,
      storeItemPda,
      orderPda
    );

    const [reviewPda, reviewBump] = getReviewPdaAndBump(orderPda);

    expect(reviewAcc.bump).toEqual(reviewBump);
    expect(reviewAcc.rating).toEqual(rating);
    expect(reviewAcc.order).toEqual(orderPda);
    expect(reviewAcc.text).toEqual(text);
    expect(storeItemAcc.reviews[0]).toEqual(reviewPda);
  });

  test('throws if order is not completed', async () => {
    const timestamp = Date.now();
    const amount = 2;
    const paymentMint = usdcMint;
    const totalUsd = price * amount;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
      shopperWallet,
      payer
    );

    const [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    const text = 'This is a review';
    const rating = 3;

    try {
      await createReview(
        program,
        text,
        rating,
        shopperWallet,
        storeItemPda,
        orderPda
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderNotCompleted');
      expect(err.error.errorCode.number).toEqual(6500);
    }
  });

  test('throws if rating is invalid', async () => {
    const text = 'This is a review';
    const rating = 0;

    try {
      await createReview(
        program,
        text,
        rating,
        shopperWallet,
        storeItemPda,
        orderPda
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('ReviewRatingInvalid');
      expect(err.error.errorCode.number).toEqual(6501);
    }
  });

  test('throws if review for order already exists', async () => {
    const text = 'This is a review';
    const rating = 3;

    await createReview(
      program,
      text,
      rating,
      shopperWallet,
      storeItemPda,
      orderPda
    );

    const newText = 'This is another review';
    const newRating = 4;

    expect(async () => {
      await createReview(
        program,
        newText,
        newRating,
        shopperWallet,
        storeItemPda,
        orderPda
      );
    }).toThrow();
  });
});
