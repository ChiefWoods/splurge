import { beforeEach, describe, expect, test } from 'bun:test';
import {
  completeOrder,
  createItem,
  createOrder,
  createShopper,
  createStore,
  initializeConfig,
  updateOrder,
  withdrawEarnings,
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
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import {
  getOrderPdaAndBump,
  getShopperPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from '../pda';

describe('withdrawEarnings', () => {
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
  const timestamp = Date.now();
  const storeItemName = 'Store Item A';
  const price = 5.55;

  let shopperUsdcAta: PublicKey;
  let usdcDecimals: number;
  let usdcMintOwner: PublicKey;
  let totalUsd: number;
  let storePda: PublicKey;
  let storeItemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;

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

    usdcDecimals = await getMint(provider.connection, usdcMint).then(
      (mint) => mint.decimals
    );

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
    totalUsd = price * amount;
    [storePda] = getStorePdaAndBump(storeWallet.publicKey);
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

    [shopperPda] = getShopperPdaAndBump(shopperWallet.publicKey);
    [orderPda] = getOrderPdaAndBump(
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
  });

  test('withdraw earnings', async () => {
    const authority = storeWallet;
    const admin = payer;
    const paymentMint = usdcMint;
    const paymentMintOwner = usdcMintOwner;

    await withdrawEarnings(
      program,
      authority,
      admin,
      paymentMint,
      paymentMintOwner
    );

    const authorityTokenAcc = await getAccount(
      provider.connection,
      getAssociatedTokenAddressSync(
        paymentMint,
        storeWallet.publicKey,
        false,
        paymentMintOwner
      )
    );

    const storeTokenAcc = await banksClient.getAccount(
      getAssociatedTokenAddressSync(
        paymentMint,
        storePda,
        true,
        paymentMintOwner
      )
    );

    expect(Number(authorityTokenAcc.amount) / 10 ** usdcDecimals).toEqual(
      totalUsd
    );
    expect(storeTokenAcc).toBeNull();
  });
});
