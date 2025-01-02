import { beforeEach, describe, expect, test } from 'bun:test';
import {
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
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from '../pda';
import { getBankrunSetup } from '../utils';

describe('updateOrder', () => {
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
  const [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
  const storeItemName = 'Store Item A';
  const price = 5.55;
  const timestamp = Date.now();

  let shopperUsdcAta: PublicKey;
  let usdcMintOwner: PublicKey;
  let storePda: PublicKey;
  let storeItemPda: PublicKey;

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

    [storePda] = getStorePdaAndBump(storeWallet.publicKey);

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
    const totalUsd = price * amount;
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
  });

  test('update order', async () => {
    const status = { shipping: {} };
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    const { orderAcc } = await updateOrder(program, status, orderPda, payer);

    expect(orderAcc.status).toEqual(status);
  });

  test('throws if updating finalized order', async () => {
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    await updateOrder(program, { cancelled: {} }, orderPda, payer);

    try {
      await updateOrder(
        program,
        { completed: {} },
        getOrderPdaAndBump(shopperPda, storeItemPda, new BN(timestamp))[0],
        payer
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('OrderAlreadyFinalized');
      expect(err.error.errorCode.number).toEqual(6405);
    }
  });

  test('throws if updating as unauthorized admin', async () => {
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    try {
      await updateOrder(program, { shipping: {} }, orderPda, shopperWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('UnauthorizedAdmin');
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
