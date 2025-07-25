import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import { getItemPda, getOrderPda, getShopperPda, getStorePda } from '../pda';
import { fetchOrderAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { USDC_MINT, USDC_PRICE_UPDATE_V2, USDT_MINT } from '../constants';
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
} from '../setup';

describe('updateOrder', () => {
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
  let orderPda: PublicKey;

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

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);
    const shopperPda = getShopperPda(shopperAuthority.publicKey);
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

  test('updates an order', async () => {
    const status = { shipping: {} };

    await program.methods
      .updateOrder(status)
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    const orderAcc = await fetchOrderAcc(program, orderPda);

    expect(orderAcc.status).toStrictEqual(status);
  });

  test('throws if updating finalized order', async () => {
    await program.methods
      .updateOrder({ cancelled: {} })
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    try {
      await program.methods
        .updateOrder({ shipping: {} })
        .accounts({
          admin: admin.publicKey,
          order: orderPda,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'OrderAlreadyFinalized');
    }
  });

  test('throws if updating as unauthorized admin', async () => {
    const status = { shipping: {} };

    try {
      await program.methods
        .updateOrder(status)
        .accounts({
          admin: storeAuthority.publicKey,
          order: orderPda,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'UnauthorizedAdmin');
    }
  });
});
