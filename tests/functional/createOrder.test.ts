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
import usdt from '../fixtures/usdt_mint.json';
import { getConfigAcc, getItemAcc, getOrderAcc } from '../accounts';

describe('createOrder', () => {
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
  const usdtMint = new PublicKey(usdt.pubkey);
  const usdtMintOwner = new PublicKey(usdt.account.owner);

  const shopperUsdcAta = getAssociatedTokenAddressSync(
    usdcMint,
    shopper.publicKey,
    false,
    usdcMintOwner
  );
  const initShopperUsdcAtaBal = 100_000_000n;

  const shopperUsdtAta = getAssociatedTokenAddressSync(
    usdtMint,
    shopper.publicKey,
    false,
    usdtMintOwner
  );
  const initShopperUsdtAtaBal = 100_000_000n;

  beforeEach(async () => {
    const [shopperUsdcAtaData, shopperUsdtAtaData] = Array.from(
      { length: 2 },
      () => Buffer.alloc(ACCOUNT_SIZE)
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

    AccountLayout.encode(
      {
        mint: usdtMint,
        owner: shopper.publicKey,
        amount: initShopperUsdtAtaBal,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      shopperUsdtAtaData
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
        address: shopperUsdcAta,
        info: {
          data: shopperUsdcAtaData,
          executable: false,
          lamports: LAMPORTS_PER_SOL,
          owner: usdcMintOwner,
        },
      },
      {
        address: shopperUsdtAta,
        info: {
          data: shopperUsdtAtaData,
          executable: false,
          lamports: LAMPORTS_PER_SOL,
          owner: usdtMintOwner,
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
  });

  test('creates an order', async () => {
    const amount = 1;
    const { unixTimestamp } = await context.banksClient.getClock();
    const timestamp = new BN(Number(unixTimestamp));
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda] = getItemPdaAndBump(storePda, itemName);

    let itemAcc = await getItemAcc(program, itemPda);

    await program.methods
      .createOrder({
        amount,
        timestamp,
      })
      .accountsPartial({
        authority: shopper.publicKey,
        store: storePda,
        item: itemPda,
        paymentMint,
        tokenProgram: paymentMintOwner,
      })
      .signers([shopper])
      .rpc();

    const [shopperPda] = getShopperPdaAndBump(shopper.publicKey);
    const [orderPda, orderBump] = getOrderPdaAndBump(
      shopperPda,
      itemPda,
      timestamp
    );

    const orderAcc = await getOrderAcc(program, orderPda);

    expect(orderAcc.bump).toBe(orderBump);
    expect(orderAcc.shopper).toStrictEqual(shopperPda);
    expect(orderAcc.item).toStrictEqual(itemPda);
    expect(orderAcc.timestamp.toNumber()).toBe(timestamp.toNumber());
    expect(orderAcc.status).toStrictEqual({ pending: {} });
    expect(orderAcc.amount).toBe(amount);
    expect(orderAcc.total).toBe(itemPrice * amount);
    expect(orderAcc.paymentMint).toStrictEqual(paymentMint);

    const postShopperUsdcAtaBal = (
      await getAccount(provider.connection, shopperUsdcAta)
    ).amount;

    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      true,
      usdcMintOwner
    );
    const orderAtaBal = (await getAccount(provider.connection, orderAta))
      .amount;

    expect(Number(orderAtaBal)).toBe(
      Number(initShopperUsdcAtaBal - postShopperUsdcAtaBal)
    );

    itemAcc = await getItemAcc(program, itemPda);

    expect(itemAcc.inventoryCount).toBe(initInventoryCount - amount);
  });

  test('throws if payment mint is not whitelisted', async () => {
    const amount = 1;
    const { unixTimestamp } = await context.banksClient.getClock();
    const timestamp = new BN(Number(unixTimestamp));
    const paymentMint = usdtMint;
    const paymentMintOwner = usdtMintOwner;

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda] = getItemPdaAndBump(storePda, itemName);

    try {
      await program.methods
        .createOrder({
          amount,
          timestamp,
        })
        .accountsPartial({
          authority: shopper.publicKey,
          store: storePda,
          item: itemPda,
          paymentMint,
          tokenProgram: paymentMintOwner,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('MintNotWhitelisted');
    }
  });

  test('throws if platform is locked', async () => {
    const [configPda] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    await program.methods
      .updateConfig({
        newAdmin: null,
        treasury: null,
        locked: true,
        orderFeeBps: null,
        whitelistedMints: configAcc.whitelistedMints,
      })
      .accounts({
        admin: context.payer.publicKey,
      })
      .signers([context.payer])
      .rpc();

    const amount = 1;
    const { unixTimestamp } = await context.banksClient.getClock();
    const timestamp = new BN(Number(unixTimestamp));
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda] = getItemPdaAndBump(storePda, itemName);

    try {
      await program.methods
        .createOrder({
          amount,
          timestamp,
        })
        .accountsPartial({
          authority: shopper.publicKey,
          store: storePda,
          item: itemPda,
          paymentMint,
          tokenProgram: paymentMintOwner,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('PlatformLocked');
    }
  });

  test('throws if item has insufficient inventory', async () => {
    const itemName = 'Item B';

    await program.methods
      .createItem({
        price: itemPrice,
        inventoryCount: 0,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    const amount = 1;
    const { unixTimestamp } = await context.banksClient.getClock();
    const timestamp = new BN(Number(unixTimestamp));
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda] = getItemPdaAndBump(storePda, itemName);

    try {
      await program.methods
        .createOrder({
          amount,
          timestamp,
        })
        .accountsPartial({
          authority: shopper.publicKey,
          store: storePda,
          item: itemPda,
          paymentMint,
          tokenProgram: paymentMintOwner,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('InsufficientInventory');
    }
  });
});
