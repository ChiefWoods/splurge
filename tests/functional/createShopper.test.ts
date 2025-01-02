import { AnchorError, Program } from '@coral-xyz/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { beforeEach, describe, expect, test } from 'bun:test';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { Splurge } from '../../target/types/splurge';
import { createShopper } from '../methods';
import { getBankrunSetup } from '../utils';
import { getShopperPdaAndBump } from '../pda';
import { MAX_SHOPPER_NAME_LEN } from '../constants';

describe('createShopper', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const shopperWallet = Keypair.generate();

  beforeEach(async () => {
    ({ context, banksClient, payer, provider, program } = await getBankrunSetup(
      [
        {
          address: shopperWallet.publicKey,
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

  test('creates a shopper account', async () => {
    const name = 'Shopper A';
    const image = 'https://example.com/image.png';
    const address =
      'Sunway University, Jalan Universiti, Bandar Sunway, 47500 Subang Jaya, Selangor';

    const { shopperAcc } = await createShopper(
      program,
      name,
      image,
      address,
      shopperWallet
    );

    const shopperBump = getShopperPdaAndBump(shopperWallet.publicKey)[1];

    expect(shopperAcc.bump).toEqual(shopperBump);
    expect(shopperAcc.name).toEqual(name);
    expect(shopperAcc.image).toEqual(image);
    expect(shopperAcc.address).toEqual(address);
    expect(shopperAcc.orders).toEqual([]);
  });

  test('throws when name is empty', async () => {
    try {
      await createShopper(
        program,
        '',
        'https://example.com/image.png',
        'Sunway University, Jalan Universiti, Bandar Sunway, 47500 Subang Jaya, Selangor',
        shopperWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('ShopperNameRequired');
      expect(err.error.errorCode.number).toEqual(6100);
    }
  });

  test('throws when name is too long', async () => {
    try {
      await createShopper(
        program,
        '_'.repeat(MAX_SHOPPER_NAME_LEN + 1),
        'https://example.com/image.png',
        'Sunway University, Jalan Universiti, Bandar Sunway, 47500 Subang Jaya, Selangor',
        shopperWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('ShopperNameTooLong');
      expect(err.error.errorCode.number).toEqual(6101);
    }
  });

  test('throws when image is empty', async () => {
    try {
      await createShopper(
        program,
        'Shopper A',
        '',
        'Sunway University, Jalan Universiti, Bandar Sunway, 47500 Subang Jaya, Selangor',
        shopperWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('ShopperImageRequired');
      expect(err.error.errorCode.number).toEqual(6102);
    }
  });

  test('throws when address is empty', async () => {
    try {
      await createShopper(
        program,
        'Shopper A',
        'https://example.com/image.png',
        '',
        shopperWallet
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('ShopperAddressRequired');
      expect(err.error.errorCode.number).toEqual(6103);
    }
  });
});
