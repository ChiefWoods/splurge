import { beforeEach, describe, expect, test } from 'bun:test';
import {
  createItem,
  createOrder,
  createShopper,
  createStore,
  initializeConfig,
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

describe('createOrder', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const storeWallet = Keypair.generate();
  const shopperWallet = Keypair.generate();
  const shopperUsdcInitBal = 100_000_000n;
  const usdcMint = new PublicKey(
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  );
  const pyusdMint = new PublicKey(
    'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM'
  );
  const storeItemName = 'Store Item A';
  const inventoryCountInit = 10;
  const price = 5.55;

  let shopperUsdcAta: PublicKey;
  let shopperPyusdAta: PublicKey;
  let usdcDecimals: number;
  let usdcMintOwner: PublicKey;
  let pyusdMintOwner: PublicKey;

  beforeEach(async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const usdcAccInfo = await connection.getAccountInfo(usdcMint);
    const pyusdAccInfo = await connection.getAccountInfo(pyusdMint);
    usdcMintOwner = usdcAccInfo.owner;
    pyusdMintOwner = pyusdAccInfo.owner;

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
        amount: shopperUsdcInitBal,
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

    shopperPyusdAta = getAssociatedTokenAddressSync(
      pyusdMint,
      shopperWallet.publicKey,
      true,
      pyusdMintOwner
    );

    const pyusdAtaData = Buffer.alloc(ACCOUNT_SIZE);

    AccountLayout.encode(
      {
        mint: pyusdMint,
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
      pyusdAtaData
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
          address: pyusdMint,
          info: pyusdAccInfo,
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
        {
          address: shopperPyusdAta,
          info: {
            lamports: 1_000_000_000,
            data: pyusdAtaData,
            owner: pyusdMintOwner,
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

    await createItem(
      program,
      storeItemName,
      'https://example.com/item.png',
      'This is a description',
      inventoryCountInit,
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
  });

  test('create order', async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

    const { shopperAcc, storeItemAcc, orderAcc } = await createOrder(
      program,
      timestamp,
      amount,
      totalUsd,
      storePda,
      storeItemPda,
      paymentMint,
      paymentMintOwner,
      shopperWallet,
      payer
    );

    const [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
    const [orderPda, orderBump] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    const walletAUsdcPostBal = await getAccount(
      provider.connection,
      shopperUsdcAta
    ).then((acc) => acc.amount);

    const orderTokenAcc = await getAccount(
      provider.connection,
      getAssociatedTokenAddressSync(paymentMint, orderPda, true, usdcMintOwner)
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
      inventoryCountInit - amount
    );
    expect(Number(orderTokenAcc.amount) / 10 ** usdcDecimals).toEqual(totalUsd);
    expect(Number(walletAUsdcPostBal)).toEqual(
      Number(shopperUsdcInitBal) - Number(orderTokenAcc.amount)
    );
  });

  test('throws if payment mint is not whitelisted', async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = pyusdMint;
    const paymentMintOwner = pyusdMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
        shopperWallet,
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('PaymentMintNotWhitelisted');
      expect(err.error.errorCode.number).toEqual(6400);
    }
  });

  test('throws if amount is less than 0', async () => {
    const timestamp = Date.now();
    const amount = -1;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
        shopperWallet,
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderAmountInvalid');
      expect(err.error.errorCode.number).toEqual(6401);
    }
  });

  test('throws if total USD is less than 0', async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = -1;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
        shopperWallet,
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderTotalInvalid');
      expect(err.error.errorCode.number).toEqual(6402);
    }
  });

  test('throws if total USD is incorrect', async () => {
    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * (amount + 1);
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
        shopperWallet,
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderTotalIncorrect');
      expect(err.error.errorCode.number).toEqual(6403);
    }
  });

  test('throws if store item has insufficient inventory', async () => {
    const storeItemName = 'Store Item B';
    const price = 5.55;

    await createItem(
      program,
      storeItemName,
      'https://example.com/item.png',
      'This is a description',
      0,
      price,
      storeWallet
    );

    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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
        shopperWallet,
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('InsufficientInventory');
      expect(err.error.errorCode.number).toEqual(6404);
    }
  });
});
