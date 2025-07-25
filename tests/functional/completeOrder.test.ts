import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
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
import { fetchConfigAcc, fetchOrderAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { USDC_MINT, USDC_PRICE_UPDATE_V2, USDT_MINT } from '../constants';
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
} from '../setup';

describe('completeOrder', () => {
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
  const initShopperAtaBal = 10e9; // $100
  const tokenProgram = TOKEN_PROGRAM_ID;
  let storePda: PublicKey;
  let itemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;

  const treasuryUsdcAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    treasury.publicKey,
    false,
    tokenProgram
  );

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

    storePda = getStorePda(storeAuthority.publicKey);
    itemPda = getItemPda(storePda, itemName);
    shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    await program.methods
      .createOrder({
        amount: 1,
      })
      .accountsPartial({
        authority: shopperAuthority.publicKey,
        store: storePda,
        item: itemPda,
        order: orderPda,
        priceUpdateV2: USDC_PRICE_UPDATE_V2,
        paymentMint: USDC_MINT,
        tokenProgram,
      })
      .signers([shopperAuthority])
      .rpc();
  });

  test('complete order', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    let orderAcc = await fetchOrderAcc(program, orderPda);

    const orderAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      orderPda,
      true,
      tokenProgram
    );
    const orderAtaBal = (await getAccount(provider.connection, orderAta))
      .amount;

    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

    const orderFee =
      orderAcc.paymentSubtotal.toNumber() *
      (configAcc.orderFeeBps / MAX_FEE_BASIS_POINTS);
    const storeEarnings = Number(orderAtaBal);

    const initTreasuryUsdcAtaBal = (
      await getAccount(provider.connection, treasuryUsdcAta)
    ).amount;

    await program.methods
      .completeOrder()
      .accountsPartial({
        admin: admin.publicKey,
        shopper: shopperPda,
        store: storePda,
        item: itemPda,
        order: orderPda,
        tokenProgram,
      })
      .signers([admin])
      .rpc();

    orderAcc = await fetchOrderAcc(program, orderPda);

    expect(orderAcc.status).toStrictEqual({ completed: {} });

    const postTreasuryUsdcAtaBal = (
      await getAccount(provider.connection, treasuryUsdcAta)
    ).amount;

    expect(Number(initTreasuryUsdcAtaBal)).toBeCloseTo(
      Number(postTreasuryUsdcAtaBal) - orderFee,
      -6
    );

    const storeUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storePda,
      true,
      tokenProgram
    );
    const storeUsdcAtaBal = (
      await getAccount(provider.connection, storeUsdcAta)
    ).amount;

    expect(storeUsdcAtaBal).toBe(orderAtaBal);

    const orderAtaAccBal = litesvm.getBalance(orderAta);

    expect(orderAtaAccBal).toBe(0n);
  });

  test('throws if order status is not shipping', async () => {
    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          admin: admin.publicKey,
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'OrderNotBeingShipped');
    }
  });

  test('throws if order is already completed', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .completeOrder()
      .accountsPartial({
        admin: admin.publicKey,
        shopper: shopperPda,
        store: storePda,
        item: itemPda,
        order: orderPda,
        tokenProgram,
      })
      .signers([admin])
      .rpc();

    expect(async () => {
      await program.methods
        .completeOrder()
        .accountsPartial({
          admin: admin.publicKey,
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram,
        })
        .signers([admin])
        .rpc();
    }).toThrow();
  });

  test('throws if signed by unauthorized admin', async () => {
    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          admin: shopperAuthority.publicKey,
          shopper: shopperPda,
          store: storePda,
          item: itemPda,
          order: orderPda,
          tokenProgram,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'UnauthorizedAdmin');
    }
  });
});
