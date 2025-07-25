import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddressSync,
  MAX_FEE_BASIS_POINTS,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import {
  getConfigPda,
  getItemPda,
  getOrderPda,
  getShopperPda,
  getStorePda,
} from '../pda';
import { fetchConfigAcc, fetchItemAcc, fetchOrderAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import {
  MINT_DECIMALS,
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
  USDT_MINT,
  USDT_PRICE_UPDATE_V2,
} from '../constants';
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
} from '../setup';

describe('createOrder', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const [admin, treasury, shopperAuthority, storeAuthority] = Array.from(
    { length: 4 },
    Keypair.generate
  );

  const itemName = 'Item A';
  const itemPrice = 10e6; // $1
  const initInventoryCount = 10;

  const shopperAuthorityUsdcAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    shopperAuthority.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  const initShopperAtaBal = 10e9; // $100

  const tokenProgram = TOKEN_PROGRAM_ID;

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      ...[admin, treasury, shopperAuthority, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ]));

    initAta(litesvm, USDC_MINT, treasury.publicKey);
    initAta(litesvm, USDC_MINT, shopperAuthority.publicKey, initShopperAtaBal);
    initAta(litesvm, USDT_MINT, treasury.publicKey);
    initAta(litesvm, USDT_MINT, shopperAuthority.publicKey, initShopperAtaBal);

    await program.methods
      .initializeConfig({
        acceptedMints: [
          {
            mint: USDC_MINT,
            priceUpdateV2: USDC_PRICE_UPDATE_V2,
          },
        ],
        admin: admin.publicKey,
        orderFeeBps: 250,
        treasury: treasury.publicKey,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .initializeShopper({
        name: 'Shopper A',
        image: 'https://example.com/image.png',
        address: 'address',
      })
      .accounts({
        authority: shopperAuthority.publicKey,
      })
      .signers([shopperAuthority])
      .rpc();

    await program.methods
      .initializeStore({
        name: 'Store A',
        image: 'https://example.com/image.png',
        about: 'about',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    await program.methods
      .listItem({
        price: new BN(itemPrice),
        inventoryCount: initInventoryCount,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();
  });

  test('creates an order', async () => {
    const treasuryAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      treasury.publicKey,
      false,
      tokenProgram
    );
    const initTreasuryAtaBal = (
      await getAccount(provider.connection, treasuryAta)
    ).amount;

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);
    const shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    await program.methods
      .createOrder({
        amount,
      })
      .accountsPartial({
        authority: shopperAuthority.publicKey,
        store: storePda,
        item: itemPda,
        order: orderPda,
        priceUpdateV2: USDC_PRICE_UPDATE_V2,
        paymentMint,
        tokenProgram,
      })
      .signers([shopperAuthority])
      .rpc();

    const orderAcc = await fetchOrderAcc(program, orderPda);

    expect(orderAcc.shopper).toStrictEqual(shopperPda);
    expect(orderAcc.item).toStrictEqual(itemPda);
    expect(orderAcc.timestamp.toNumber()).toBe(Number(unixTimestamp));
    expect(orderAcc.status).toStrictEqual({ pending: {} });
    expect(orderAcc.amount).toBe(amount);
    expect(orderAcc.paymentSubtotal.toNumber()).toBeCloseTo(
      itemPrice * amount,
      -MINT_DECIMALS
    );
    expect(orderAcc.paymentMint).toStrictEqual(paymentMint);

    const postShopperUsdcAtaBal = (
      await getAccount(provider.connection, shopperAuthorityUsdcAta)
    ).amount;

    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      true,
      tokenProgram
    );
    const orderAtaBal = (await getAccount(provider.connection, orderAta))
      .amount;

    expect(initShopperAtaBal).toBeCloseTo(
      Number(postShopperUsdcAtaBal + orderAtaBal),
      -MINT_DECIMALS
    );

    const configPda = getConfigPda();
    const { orderFeeBps } = await fetchConfigAcc(program, configPda);

    const postTreasuryAtaBal = (
      await getAccount(provider.connection, treasuryAta)
    ).amount;
    const platformFee = Math.round(
      (Number(orderAtaBal) * orderFeeBps) / MAX_FEE_BASIS_POINTS
    );

    expect(Number(initTreasuryAtaBal)).toBeCloseTo(
      Number(postTreasuryAtaBal) - platformFee
    );

    const itemAcc = await fetchItemAcc(program, itemPda);

    expect(initInventoryCount).toBe(itemAcc.inventoryCount + amount);
  });

  test('throws if payment mint is not accepted', async () => {
    const amount = 1;
    const paymentMint = USDT_MINT;

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);
    const shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    try {
      await program.methods
        .createOrder({
          amount,
        })
        .accountsPartial({
          authority: shopperAuthority.publicKey,
          store: storePda,
          item: itemPda,
          order: orderPda,
          priceUpdateV2: USDT_PRICE_UPDATE_V2,
          paymentMint,
          tokenProgram,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'PaymentMintNotAccepted');
    }
  });

  test('throws if platform is locked', async () => {
    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

    await program.methods
      .updateConfig({
        acceptedMints: null,
        isPaused: true,
        newAdmin: null,
        orderFeeBps: null,
        treasury: null,
      })
      .accounts({
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);
    const shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    try {
      await program.methods
        .createOrder({
          amount,
        })
        .accountsPartial({
          authority: shopperAuthority.publicKey,
          store: storePda,
          item: itemPda,
          order: orderPda,
          priceUpdateV2: USDC_PRICE_UPDATE_V2,
          paymentMint,
          tokenProgram,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'PlatformPaused');
    }
  });

  test('throws if item has insufficient inventory', async () => {
    const itemName = 'Item B';

    await program.methods
      .listItem({
        price: new BN(itemPrice),
        inventoryCount: 0,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    const amount = 1;
    const paymentMint = USDC_MINT;

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);
    const shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    const orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    try {
      await program.methods
        .createOrder({
          amount,
        })
        .accountsPartial({
          authority: shopperAuthority.publicKey,
          store: storePda,
          item: itemPda,
          order: orderPda,
          priceUpdateV2: USDC_PRICE_UPDATE_V2,
          paymentMint,
          tokenProgram,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'InsufficientInventory');
    }
  });
});
