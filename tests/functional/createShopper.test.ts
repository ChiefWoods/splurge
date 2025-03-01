import { AnchorError, Program } from '@coral-xyz/anchor';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { beforeEach, describe, expect, test } from 'bun:test';
import { ProgramTestContext } from 'solana-bankrun';
import { Splurge } from '../../target/types/splurge';
import { getBankrunSetup } from '../setup';
import { getShopperPdaAndBump } from '../pda';
import { MAX_SHOPPER_NAME_LEN } from '../constants';
import usdc from '../fixtures/usdc_mint.json';
import { getShopperAcc } from '../accounts';

describe('createShopper', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const [treasury, shopper] = Array.from({ length: 2 }, Keypair.generate);

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup(
      [treasury, shopper].map((kp) => {
        return {
          address: kp.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: LAMPORTS_PER_SOL,
            owner: SystemProgram.programId,
          },
        };
      })
    ));

    const admin = context.payer;
    const whitelistedMints = [new PublicKey(usdc.pubkey)];

    const orderFeeBps = 250;

    await program.methods
      .initializeConfig({
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        whitelistedMints,
        orderFeeBps,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();
  });

  test('creates a shopper', async () => {
    const name = 'Shopper A';
    const image = 'https://example.com/image.png';
    const address = 'address';

    await program.methods
      .createShopper({
        name,
        image,
        address,
      })
      .accounts({
        authority: shopper.publicKey,
      })
      .signers([shopper])
      .rpc();

    const [shopperPda, shopperBump] = getShopperPdaAndBump(shopper.publicKey);
    const shopperAcc = await getShopperAcc(program, shopperPda);

    expect(shopperAcc.bump).toBe(shopperBump);
    expect(shopperAcc.name).toBe(name);
    expect(shopperAcc.image).toBe(image);
    expect(shopperAcc.address).toBe(address);
    expect(shopperAcc.authority).toStrictEqual(shopper.publicKey);
  });

  test('throws when name is empty', async () => {
    const name = '';
    const image = 'https://example.com/image.png';
    const address = 'address';

    try {
      await program.methods
        .createShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopper.publicKey,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ShopperNameRequired');
    }
  });

  test('throws when name is too long', async () => {
    const name = '_'.repeat(MAX_SHOPPER_NAME_LEN + 1);
    const image = 'https://example.com/image.png';
    const address = 'address';

    try {
      await program.methods
        .createShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopper.publicKey,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ShopperNameTooLong');
    }
  });

  test('throws when image is empty', async () => {
    const name = 'Shopper A';
    const image = '';
    const address = 'address';

    try {
      await program.methods
        .createShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopper.publicKey,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ShopperImageRequired');
    }
  });

  test('throws when address is empty', async () => {
    const name = 'Shopper A';
    const image = 'https://example.com/image.png';
    const address = '';

    try {
      await program.methods
        .createShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopper.publicKey,
        })
        .signers([shopper])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ShopperAddressRequired');
    }
  });
});
