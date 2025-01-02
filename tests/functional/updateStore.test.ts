import { AnchorError, Program } from '@coral-xyz/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { beforeEach, describe, expect, test } from 'bun:test';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { Splurge } from '../../target/types/splurge';
import { createStore, updateStore } from '../methods';
import { getBankrunSetup } from '../utils';
import { MAX_STORE_NAME_LEN } from '../constants';

describe('updateStore', () => {
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

  test('updates a store account', async () => {
    const name = 'New Store A';
    const image = 'https://example.com/new-image.png';
    const about = 'This is an updated store';

    const { storeAcc } = await updateStore(
      program,
      name,
      image,
      about,
      storeWallet
    );

    expect(storeAcc.name).toEqual(name);
    expect(storeAcc.image).toEqual(image);
    expect(storeAcc.about).toEqual(about);
  });

  test('throws when name is empty', async () => {
    try {
      await updateStore(
        program,
        '',
        'https://example.com/new-image.png',
        'This is an updated store',
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreNameRequired');
      expect(err.error.errorCode.number).toEqual(6200);
    }
  });

  test('throws when name is too long', async () => {
    expect(async () => {
      await updateStore(
        program,
        '_'.repeat(MAX_STORE_NAME_LEN + 1),
        'https://example.com/new-image.png',
        'This is an updated store',
        storeWallet
      );
    }).toThrow();
  });

  test('throws when image is empty', async () => {
    try {
      await updateStore(
        program,
        'New Store A',
        '',
        'This is an updated store',
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreImageRequired');
      expect(err.error.errorCode.number).toEqual(6202);
    }
  });
});
