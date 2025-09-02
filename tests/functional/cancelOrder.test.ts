import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import {
  getItemPda,
  getOrderPda,
  getShopperPda,
  getStorePda,
  getTreasuryPda,
} from '../pda';
import { fetchOrderAcc, fetchTaskQueueAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import {
  TUKTUK_PROGRAM_ID,
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
  USDT_MINT,
} from '../constants';
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
  initTaskQueue,
} from '../setup';
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from '@helium/tuktuk-sdk';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';

describe('cancelOrder', () => {
  let { litesvm, provider, program, tuktukProgram, taskQueuePda } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
    tuktukProgram: Program<Tuktuk>;
    taskQueuePda: PublicKey;
  };

  const [admin, shopperAuthority, storeAuthority] = Array.from(
    { length: 3 },
    Keypair.generate
  );
  const treasury = getTreasuryPda();

  const itemName = 'Item A';
  const itemPrice = 1e6; // $1
  const initInventoryCount = 10;
  const initShopperAtaBal = 1e8; // $100
  const paymentMint = USDC_MINT;
  const tokenProgram = TOKEN_PROGRAM_ID;
  let orderPda: PublicKey;
  let taskQueueAcc: TaskQueueV0;
  let taskId: number;

  const shopperPda = getShopperPda(shopperAuthority.publicKey);
  const storePda = getStorePda(storeAuthority.publicKey);
  const itemPda = getItemPda(storePda, itemName);

  beforeEach(async () => {
    ({ litesvm, provider, program, tuktukProgram, taskQueuePda } =
      await getSetup([
        ...[admin, shopperAuthority, storeAuthority].map((kp) => {
          return {
            pubkey: kp.publicKey,
            account: fundedSystemAccountInfo(LAMPORTS_PER_SOL * 5),
          };
        }),
      ]));

    await initTaskQueue(tuktukProgram, admin, taskQueuePda);
    taskQueueAcc = await fetchTaskQueueAcc(tuktukProgram, taskQueuePda);
    taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];

    initAta(litesvm, USDC_MINT, treasury);
    initAta(litesvm, USDC_MINT, shopperAuthority.publicKey, initShopperAtaBal);
    initAta(litesvm, USDT_MINT, treasury);
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

    const { unixTimestamp } = litesvm.getClock();
    orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    await program.methods
      .createOrder(1, new BN(unixTimestamp))
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

    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      !PublicKey.isOnCurve(orderPda)
    );
    const [taskPda] = taskKey(taskQueuePda, taskId);
    const [taskQueueAuthorityPda] = taskQueueAuthorityKey(
      taskQueuePda,
      admin.publicKey
    );

    await program.methods
      .shipOrder(taskId)
      .accountsPartial({
        admin: admin.publicKey,
        order: orderPda,
        authority: shopperAuthority.publicKey,
        item: itemPda,
        orderTokenAccount: orderAta,
        paymentMint,
        shopper: shopperPda,
        store: storePda,
        task: taskPda,
        taskQueue: taskQueuePda,
        taskQueueAuthority: taskQueueAuthorityPda,
        tokenProgram,
        tuktuk: TUKTUK_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();
  });

  test('cancels an order', async () => {
    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      !PublicKey.isOnCurve(orderPda),
      tokenProgram
    );
    const preOrderAtaRent = litesvm.getBalance(orderAta);
    const preShopperAuthorityBal = litesvm.getBalance(
      shopperAuthority.publicKey
    );
    const shopperAuthorityAta = getAssociatedTokenAddressSync(
      paymentMint,
      shopperAuthority.publicKey,
      !PublicKey.isOnCurve(shopperAuthority.publicKey),
      tokenProgram
    );
    const preShopperAuthorityAta = await getAccount(
      provider.connection,
      shopperAuthorityAta
    );
    const treasuryAta = getAssociatedTokenAddressSync(
      paymentMint,
      treasury,
      !PublicKey.isOnCurve(treasury),
      tokenProgram
    );
    const preTreasuryAta = await getAccount(provider.connection, treasuryAta);

    await program.methods
      .cancelOrder()
      .accountsPartial({
        admin: admin.publicKey,
        order: orderPda,
        paymentMint,
        shopper: shopperPda,
        tokenProgram,
      })
      .signers([admin])
      .rpc();

    const orderAcc = await fetchOrderAcc(program, orderPda);

    expect(orderAcc.status).toStrictEqual({ cancelled: {} });

    const postShopperAuthorityBal = litesvm.getBalance(
      shopperAuthority.publicKey
    );

    expect(preShopperAuthorityBal).toBe(
      postShopperAuthorityBal - preOrderAtaRent
    );

    const postShopperAuthorityAta = await getAccount(
      provider.connection,
      shopperAuthorityAta
    );

    expect(Number(preShopperAuthorityAta.amount)).toBe(
      Number(postShopperAuthorityAta.amount) -
        orderAcc.paymentSubtotal.toNumber() -
        orderAcc.platformFee.toNumber()
    );

    const postOrderAtaRent = litesvm.getBalance(orderAta);

    expect(postOrderAtaRent).toBe(0n);

    const postTreasuryAta = await getAccount(provider.connection, treasuryAta);

    expect(Number(preTreasuryAta.amount)).toBe(
      Number(postTreasuryAta.amount) + orderAcc.platformFee.toNumber()
    );
  });

  test('throws if cancelling as unauthorized admin', async () => {
    try {
      await program.methods
        .cancelOrder()
        .accountsPartial({
          admin: storeAuthority.publicKey,
          order: orderPda,
          paymentMint,
          shopper: shopperPda,
          tokenProgram,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'UnauthorizedAdmin');
    }
  });
});
