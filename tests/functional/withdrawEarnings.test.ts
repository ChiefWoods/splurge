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
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import {
  expectAnchorError,
  fundedSystemAccountInfo,
  getSetup,
  initAta,
  initTaskQueue,
} from '../setup';
import {
  TUKTUK_PROGRAM_ID,
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
} from '../constants';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
  TaskQueueV0,
} from '@helium/tuktuk-sdk';
import { fetchTaskQueueAcc } from '../accounts';

describe('withdrawEarnings', () => {
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
  let storePda: PublicKey;
  let itemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;
  let orderAta: PublicKey;
  let taskQueueAcc: TaskQueueV0;
  let taskId: number;

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

    storePda = getStorePda(storeAuthority.publicKey);
    itemPda = getItemPda(storePda, itemName);
    shopperPda = getShopperPda(shopperAuthority.publicKey);
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
        paymentMint: USDC_MINT,
        tokenProgram,
      })
      .signers([shopperAuthority])
      .rpc();

    orderAta = getAssociatedTokenAddressSync(
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
  });

  test('withdraw earnings', async () => {
    const storeUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storePda,
      true,
      tokenProgram
    );
    const preStoreUsdcAtaAcc = await getAccount(
      provider.connection,
      storeUsdcAta
    );

    await program.methods
      .withdrawEarnings()
      .accountsPartial({
        authority: storeAuthority.publicKey,
        store: storePda,
        paymentMint: USDC_MINT,
        tokenProgram,
      })
      .signers([storeAuthority])
      .rpc();

    const storeAuthorityUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storeAuthority.publicKey,
      false,
      tokenProgram
    );
    const storeAuthorityUsdcAtaAcc = await getAccount(
      provider.connection,
      storeAuthorityUsdcAta
    );

    expect(Number(storeAuthorityUsdcAtaAcc.amount)).toBe(
      Number(preStoreUsdcAtaAcc.amount)
    );

    const postStoreUsdcAtaAcc = await getAccount(
      provider.connection,
      storeUsdcAta,
      'processed'
    );

    expect(postStoreUsdcAtaAcc.amount).toBe(0n);
  });

  test('throws if withdrawing as unauthorized store authority', async () => {
    try {
      await program.methods
        .withdrawEarnings()
        .accountsPartial({
          authority: storeAuthority.publicKey,
          store: storePda,
          paymentMint: USDC_MINT,
          tokenProgram,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'UnauthorizedStoreAuthority');
    }
  });
});
