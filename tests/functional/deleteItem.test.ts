import { beforeEach, describe, expect, test } from 'bun:test';
import { createItem, createStore, deleteItem } from '../methods';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import { getStoreItemPdaAndBump, getStorePdaAndBump } from '../pda';

describe('deleteItem', () => {
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

  test('delete item', async () => {
    const { storeAcc } = await deleteItem(program, storeItemName, storeWallet);

    const [storeItemPda] = getStoreItemPdaAndBump(
      getStorePdaAndBump(storeWallet.publicKey)[0],
      storeItemName
    );

    expect(storeAcc.items).not.toContain(storeItemPda);
  });

  test('throws if deleting an item not in the store', async () => {
    try {
      await deleteItem(program, storeItemName, storeWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreItemNotFound');
      expect(err.error.errorCode.number).toEqual(6304);
    }
  });
});
