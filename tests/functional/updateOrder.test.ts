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
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getItemPdaAndBump,
  getStorePdaAndBump,
} from '../pda';
import { getBankrunSetup } from '../setup';
import usdc from '../fixtures/usdc_mint.json';
import { getOrderAcc } from '../accounts';

describe('updateOrder', () => {
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

  const [shopperPda] = getShopperPdaAndBump(shopper.publicKey);
  const [storePda] = getStorePdaAndBump(store.publicKey);
  const [itemPda] = getItemPdaAndBump(storePda, itemName);
  let orderPda: PublicKey;

  const shopperUsdcAta = getAssociatedTokenAddressSync(
    usdcMint,
    shopper.publicKey,
    false,
    usdcMintOwner
  );
  const initShopperUsdcAtaBal = 100_000_000n;

  beforeEach(async () => {
    const shopperUsdcAtaData = Buffer.alloc(ACCOUNT_SIZE);

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

  test('updates an order', async () => {
    const status = { shipping: {} };

    await program.methods
      .updateOrder(status)
      .accountsPartial({
        order: orderPda,
      })
      .signers([context.payer])
      .rpc();

    const orderAcc = await getOrderAcc(program, orderPda);

    expect(orderAcc.status).toStrictEqual(status);
  });

  test('throws if updating finalized order', async () => {
    await program.methods
      .updateOrder({ cancelled: {} })
      .accountsPartial({
        admin: context.payer.publicKey,
        order: orderPda,
      })
      .signers([context.payer])
      .rpc();

    try {
      await program.methods
        .updateOrder({ shipping: {} })
        .accountsPartial({
          order: orderPda,
        })
        .signers([context.payer])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('OrderAlreadyFinalized');
    }
  });

  test('throws if updating as unauthorized admin', async () => {
    const status = { shipping: {} };

    try {
      await program.methods
        .updateOrder(status)
        .accountsPartial({
          admin: store.publicKey,
          order: orderPda,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('UnauthorizedAdmin');
    }
  });
});
