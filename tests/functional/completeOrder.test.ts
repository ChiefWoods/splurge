import { beforeEach, describe, expect, test } from 'bun:test';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../setup';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getItemPdaAndBump,
  getStorePdaAndBump,
  getConfigPdaAndBump,
} from '../pda';
import usdc from '../fixtures/usdc_mint.json';
import { getConfigAcc, getOrderAcc } from '../accounts';
import { MAX_BASIS_POINTS, PRICE_SCALE_FACTOR } from '../constants';

describe('completeOrder', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const [treasury, shopper, store] = Array.from(
    { length: 3 },
    Keypair.generate
  );

  const itemName = 'Item A';
  const itemPrice = 1000; // $10
  const initInventoryCount = 10;

  const usdcMint = new PublicKey(usdc.pubkey);
  const usdcMintOwner = new PublicKey(usdc.account.owner);
  const usdcMintDecimals = 6;

  const [shopperPda] = getShopperPdaAndBump(shopper.publicKey);
  const [storePda] = getStorePdaAndBump(store.publicKey);
  const [itemPda] = getItemPdaAndBump(storePda, itemName);
  let orderPda: PublicKey;

  const treasuryUsdcAta = getAssociatedTokenAddressSync(
    usdcMint,
    treasury.publicKey,
    false,
    usdcMintOwner
  );
  const shopperUsdcAta = getAssociatedTokenAddressSync(
    usdcMint,
    shopper.publicKey,
    false,
    usdcMintOwner
  );
  const initShopperUsdcAtaBal = 100_000_000n;

  beforeEach(async () => {
    const [treasuryUsdcAtaData, shopperUsdcAtaData] = Array.from(
      { length: 2 },
      () => Buffer.alloc(ACCOUNT_SIZE)
    );

    AccountLayout.encode(
      {
        mint: usdcMint,
        owner: treasury.publicKey,
        amount: 0n,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      treasuryUsdcAtaData
    );

    AccountLayout.encode(
      {
        mint: usdcMint,
        owner: shopper.publicKey,
        amount: initShopperUsdcAtaBal,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      shopperUsdcAtaData
    );

    ({ context, provider, program } = await getBankrunSetup([
      ...[treasury, shopper, store].map((kp) => {
        return {
          address: kp.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: LAMPORTS_PER_SOL,
            owner: SystemProgram.programId,
          },
        };
      }),
      {
        address: treasuryUsdcAta,
        info: {
          data: treasuryUsdcAtaData,
          executable: false,
          lamports: LAMPORTS_PER_SOL,
          owner: usdcMintOwner,
        },
      },
      {
        address: shopperUsdcAta,
        info: {
          data: shopperUsdcAtaData,
          executable: false,
          lamports: LAMPORTS_PER_SOL,
          owner: usdcMintOwner,
        },
      },
    ]));

    const admin = context.payer;
    const whitelistedMints = [new PublicKey(usdc.pubkey)];
    const orderFeeBps = 250;

    await program.methods
      .initializeConfig({
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        whitelistedMints,
        orderFeeBps,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .createShopper({
        name: 'Shopper A',
        image: 'https://example.com/image.png',
        address: 'address',
      })
      .accounts({
        authority: shopper.publicKey,
      })
      .signers([shopper])
      .rpc();

    await program.methods
      .createStore({
        name: 'Store A',
        image: 'https://example.com/image.png',
        about: 'about',
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    await program.methods
      .createItem({
        price: itemPrice,
        inventoryCount: initInventoryCount,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    const { unixTimestamp } = await context.banksClient.getClock();
    const timestamp = new BN(Number(unixTimestamp));

    orderPda = getOrderPdaAndBump(shopperPda, itemPda, timestamp)[0];

    await program.methods
      .createOrder({
        amount: 1,
        timestamp,
      })
      .accountsPartial({
        authority: shopper.publicKey,
        store: storePda,
        item: itemPda,
        paymentMint: usdcMint,
        tokenProgram: usdcMintOwner,
      })
      .signers([shopper])
      .rpc();
  });

  test('complete order', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        order: orderPda,
      })
      .signers([context.payer])
      .rpc();

    let orderAcc = await getOrderAcc(program, orderPda);

    const orderAta = getAssociatedTokenAddressSync(
      usdcMint,
      orderPda,
      true,
      usdcMintOwner
    );
    const orderAtaBal = (await getAccount(provider.connection, orderAta))
      .amount;

    const [configPda] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    const orderFee =
      (orderAcc.total / PRICE_SCALE_FACTOR) *
      (configAcc.orderFeeBps / MAX_BASIS_POINTS) *
      10 ** usdcMintDecimals;
    const storeEarnings = Number(orderAtaBal) - orderFee;

    const initTreasuryUsdcAtaBal = (
      await getAccount(provider.connection, treasuryUsdcAta)
    ).amount;

    await program.methods
      .completeOrder()
      .accountsPartial({
        shopper: shopperPda,
        store: storePda,
        item: itemPda,
        order: orderPda,
        tokenProgram: usdcMintOwner,
      })
      .signers([context.payer])
      .rpc();

    orderAcc = await getOrderAcc(program, orderPda);

    expect(orderAcc.status).toStrictEqual({ completed: {} });

    const postTreasuryUsdcAtaBal = (
      await getAccount(provider.connection, treasuryUsdcAta)
    ).amount;

    expect(Number(postTreasuryUsdcAtaBal)).toBe(
      Number(initTreasuryUsdcAtaBal) + orderFee
    );

    const storeUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      storePda,
      true,
      usdcMintOwner
    );
    const storeUsdcAtaBal = (
      await getAccount(provider.connection, storeUsdcAta)
    ).amount;

    expect(Number(storeUsdcAtaBal)).toBe(storeEarnings);

    const orderAtaAcc = await context.banksClient.getAccount(orderAta);

    expect(orderAtaAcc).toBeNull();
  });

  test('throws if order status is not shipping', async () => {
    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram: usdcMintOwner,
        })
        .signers([context.payer])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('OrderNotBeingShipped');
    }
  });

  test('throws if order is already completed', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        order: orderPda,
      })
      .signers([context.payer])
      .rpc();

    await program.methods
      .completeOrder()
      .accountsPartial({
        shopper: shopperPda,
        store: storePda,
        item: itemPda,
        order: orderPda,
        tokenProgram: usdcMintOwner,
      })
      .signers([context.payer])
      .rpc();

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram: usdcMintOwner,
        })
        .signers([context.payer])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('AccountNotInitialized');
    }
  });

  test('throws if signed by unauthorized admin', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        order: orderPda,
      })
      .signers([context.payer])
      .rpc();

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          admin: shopper.publicKey,
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram: usdcMintOwner,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('UnauthorizedAdmin');
    }
  });
});
