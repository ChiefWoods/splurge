import { AnchorError, Program } from '@coral-xyz/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { beforeEach, describe, expect, test } from 'bun:test';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { Splurge } from '../../target/types/splurge';
import { createStore } from '../methods';
import { getBankrunSetup } from '../utils';
import { getStorePdaAndBump } from '../pda';
import { MAX_STORE_NAME_LEN } from '../constants';

describe('createStore', () => {
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
  });

  test('creates a store account', async () => {
    const name = 'Store A';
    const image = 'https://example.com/image.png';
    const about = 'This is a store';

    const { storeAcc } = await createStore(
      program,
      name,
      image,
      about,
      storeWallet
    );

    const shopperBump = getStorePdaAndBump(storeWallet.publicKey)[1];

    expect(storeAcc.bump).toEqual(shopperBump);
    expect(storeAcc.name).toEqual(name);
    expect(storeAcc.image).toEqual(image);
    expect(storeAcc.about).toEqual(about);
    expect(storeAcc.items).toEqual([]);
  });

  test('throws when name is empty', async () => {
    try {
      await createStore(
        program,
        '',
        'https://example.com/image.png',
        'This is a store',
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreNameRequired');
      expect(err.error.errorCode.number).toEqual(6200);
    }
  });

  test('throws when name is too long', async () => {
    try {
      await createStore(
        program,
        '_'.repeat(MAX_STORE_NAME_LEN + 1),
        'https://example.com/image.png',
        'This is a store',
        storeWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreNameTooLong');
      expect(err.error.errorCode.number).toEqual(6201);
    }
  });

  test('throws when image is empty', async () => {
    try {
      await createStore(program, 'Store A', '', 'This is a store', storeWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('StoreImageRequired');
      expect(err.error.errorCode.number).toEqual(6202);
    }
  });
});
