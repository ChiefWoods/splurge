import { beforeEach, describe, test } from 'bun:test';
import {
  completeOrder,
  createItem,
  createOrder,
  createReview,
  createShopper,
  createStore,
  initializeConfig,
  updateOrder,
  withdrawEarnings,
} from './methods';
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
import { Splurge } from '../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from './utils';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from './pda';

describe('end-to-end', () => {
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

  let shopperUsdcAta: PublicKey;
  let usdcMintOwner: PublicKey;

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
  });

  test('splurge', async () => {
    await initializeConfig(program, payer, [usdcMint]);

    await createStore(
      program,
      'Store A',
      'https://example.com/image.png',
      'This is a description',
      storeWallet
    );

    const storeItemName = 'Store Item A';
    const price = 5.55;

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

    const timestamp = Date.now();
    const amount = 2;
    const totalUsd = price * amount;
    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
    const [storeItemPda] = getStoreItemPdaAndBump(storePda, storeItemName);

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

    const [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
    const [orderPda] = getOrderPdaAndBump(
      shopperPda,
      storeItemPda,
      new BN(timestamp)
    );

    await updateOrder(program, { shipping: {} }, orderPda, payer);

    await completeOrder(
      program,
      timestamp,
      payer,
      shopperPda,
      storePda,
      storeItemPda,
      usdcMint,
      usdcMintOwner
    );

    await createReview(
      program,
      'This is a review',
      3,
      shopperWallet,
      storeItemPda,
      orderPda
    );

    await withdrawEarnings(
      program,
      storeWallet,
      payer,
      usdcMint,
      usdcMintOwner
    );
  });
});
