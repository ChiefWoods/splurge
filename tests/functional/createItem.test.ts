import { beforeEach, describe, expect, test } from 'bun:test';
import { createItem, createStore } from '../methods';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import { getStoreItemPdaAndBump, getStorePdaAndBump } from '../pda';
import { MAX_STORE_ITEM_NAME_LEN } from '../constants';

describe('createItem', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const storeWallet = Keypair.generate();

  beforeEach(async () => {
    ({ context, banksClient, payer, provider, program } = await getBankrunSetup(
      [
        {
          address: storeWallet.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: 5_000_000,
            owner: SystemProgram.programId,
          },
        },
      ]
    ));

    await createStore(
      program,
      'Store A',
      'https://example.com/image.png',
      'This is a store',
      storeWallet
    );
  });

  test('add item', async () => {
    const name = 'Store Item A';
    const image = 'https://example.com/item.png';
    const description = 'This is a description';
    const inventoryCount = 10;
    const price = 5.55;

    const { storeItemAcc, storeAcc } = await createItem(
      program,
      name,
      image,
      description,
      inventoryCount,
      price,
      storeWallet
    );

    const [storePda] = getStorePdaAndBump(storeWallet.publicKey);
    const [storeItemPda, storeItemBump] = getStoreItemPdaAndBump(
      storePda,
      name
    );

    expect(storeItemAcc.bump).toEqual(storeItemBump);
    expect(storeItemAcc.inventoryCount.toNumber()).toEqual(inventoryCount);
    expect(storeItemAcc.price).toEqual(price);
    expect(storeItemAcc.store).toEqual(storePda);
    expect(storeItemAcc.name).toEqual(name);
    expect(storeItemAcc.image).toEqual(image);
    expect(storeItemAcc.description).toEqual(description);
    expect(storeItemAcc.reviews).toEqual([]);
    expect(storeAcc.items[0]).toEqual(storeItemPda);
  });

  test('throws if item name is empty', async () => {
    try {
      await createItem(
        program,
        '',
        'https://example.com/item.png',
        'This is a description',
        10,
        5.55,
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreItemNameRequired');
      expect(err.error.errorCode.number).toEqual(6300);
    }
  });

  test('throws if item name is too long', async () => {
    expect(async () => {
      await createItem(
        program,
        '_'.repeat(MAX_STORE_ITEM_NAME_LEN + 1),
        'https://example.com/item.png',
        'This is a description',
        10,
        5.55,
        storeWallet
      );
    }).toThrow();
  });

  test('throws if item image is empty', async () => {
    try {
      await createItem(
        program,
        'Store Item B',
        '',
        'This is a description',
        10,
        5.55,
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreItemImageRequired');
      expect(err.error.errorCode.number).toEqual(6302);
    }
  });
});
