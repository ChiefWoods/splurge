import { beforeEach, describe, expect, test } from 'bun:test';
import {
  completeOrder,
  createItem,
  createOrder,
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
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from '../pda';

describe('completeOrder', () => {
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

  let shopperUsdcAta: PublicKey;
  let usdcDecimals: number;
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

    usdcDecimals = await getMint(provider.connection, usdcMint).then(
      (mint) => mint.decimals
    );

    await initializeConfig(program, payer, [usdcMint]);

    await createStore(
      program,
      'Store A',
      'https://example.com/image.png',
      'This is a description',
      storeWallet
    );

    const storeItemName = 'Store Item A';
    const price = 5.55;

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
  });

  test('complete order', async () => {
    const admin = payer;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const { orderAcc } = await completeOrder(
      program,
      timestamp,
      admin,
      shopperPda,
      storePda,
      storeItemPda,
      paymentMint,
      paymentMintOwner
    );

    const storeTokenAcc = await getAccount(
      provider.connection,
      getAssociatedTokenAddressSync(
        paymentMint,
        storePda,
        true,
        paymentMintOwner
      )
    );
    const orderTokenAcc = await banksClient.getAccount(
      getAssociatedTokenAddressSync(
        paymentMint,
        orderPda,
        true,
        paymentMintOwner
      )
    );

    expect(orderAcc.status).toEqual({ completed: {} });
    expect(Number(storeTokenAcc.amount) / 10 ** usdcDecimals).toEqual(totalUsd);
    expect(orderTokenAcc).toBeNull();
  });

  test('throws if order status is not shipping', async () => {
    const admin = payer;

    try {
      await completeOrder(
        program,
        timestamp,
        admin,
        shopperPda,
        storePda,
        storeItemPda,
        usdcMint,
        usdcMintOwner
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderNotShipping');
      expect(err.error.errorCode.number).toEqual(6406);
    }
  });

  test('throws if order is already completed', async () => {
    const admin = payer;

    await completeOrder(
      program,
      timestamp,
      admin,
      shopperPda,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner
    );

    try {
      await completeOrder(
        program,
        timestamp,
        admin,
        shopperPda,
        storePda,
        storeItemPda,
        usdcMint,
        usdcMintOwner
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('AccountNotInitialized');
      expect(err.error.errorCode.number).toEqual(3012);
    }
  });

  test('throws if signed by unauthorized admin', async () => {
    const admin = shopperWallet;

    try {
      await completeOrder(
        program,
        timestamp,
        admin,
        shopperPda,
        storePda,
        storeItemPda,
        usdcMint,
        usdcMintOwner
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('UnauthorizedAdmin');
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
