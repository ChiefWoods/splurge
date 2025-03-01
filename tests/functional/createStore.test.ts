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
import { getStorePdaAndBump } from '../pda';
import { MAX_STORE_NAME_LEN } from '../constants';
import usdc from '../fixtures/usdc_mint.json';
import { getStoreAcc } from '../accounts';

describe('createStore', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const [treasury, store] = Array.from({ length: 2 }, Keypair.generate);

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup(
      [treasury, store].map((kp) => {
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

  test('creates a store', async () => {
    const name = 'Store A';
    const image = 'https://example.com/image.png';
    const about = 'about';

    await program.methods
      .createStore({
        name,
        image,
        about,
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    const [storePda, storeBump] = getStorePdaAndBump(store.publicKey);
    const storeAcc = await getStoreAcc(program, storePda);

    expect(storeAcc.bump).toBe(storeBump);
    expect(storeAcc.name).toBe(name);
    expect(storeAcc.image).toBe(image);
    expect(storeAcc.about).toBe(about);
    expect(storeAcc.authority).toStrictEqual(store.publicKey);
  });

  test('throws when name is empty', async () => {
    const name = '';
    const image = 'https://example.com/image.png';
    const about = 'about';

    try {
      await program.methods
        .createStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('StoreNameRequired');
    }
  });

  test('throws when name is too long', async () => {
    const name = 'a'.repeat(MAX_STORE_NAME_LEN + 1);
    const image = 'https://example.com/image.png';
    const about = 'about';

    try {
      await program.methods
        .createStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('StoreNameTooLong');
    }
  });

  test('throws when image is empty', async () => {
    const name = 'Store A';
    const image = '';
    const about = 'about';

    try {
      await program.methods
        .createStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('StoreImageRequired');
    }
  });
});
