import { beforeEach, describe, expect, test } from 'bun:test';
import { createItem, createStore, updateItem } from '../methods';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';

describe('updateItem', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const storeWallet = Keypair.generate();
  const storeItemName = 'Store Item A';

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

    await createItem(
      program,
      storeItemName,
      'https://example.com/item.png',
      'This is a description',
      10,
      5.55,
      storeWallet
    );
  });

  test('update item', async () => {
    const inventoryCount = 5;
    const price = 8.95;

    const { storeItemAcc } = await updateItem(
      program,
      storeItemName,
      inventoryCount,
      price,
      storeWallet
    );

    expect(storeItemAcc.inventoryCount.toNumber()).toEqual(inventoryCount);
    expect(storeItemAcc.price).toEqual(price);
  });

  test('throws if store item price is negative', async () => {
    try {
      await updateItem(program, storeItemName, 5, -0.5, storeWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreItemPriceIsNegative');
      expect(err.error.errorCode.number).toEqual(6303);
    }
  });
});
