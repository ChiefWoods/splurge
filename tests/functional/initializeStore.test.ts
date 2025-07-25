import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { beforeEach, describe, expect, test } from 'bun:test';
import { Splurge } from '../../target/types/splurge';
import { MAX_STORE_NAME_LEN } from '../constants';
import { fetchStoreAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from '../setup';
import { getStorePda } from '../pda';

describe('initializeStore', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const storeAuthority = Keypair.generate();

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: storeAuthority.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test('creates a store', async () => {
    const name = 'Store A';
    const image = 'https://example.com/image.png';
    const about = 'about';

    await program.methods
      .initializeStore({
        name,
        image,
        about,
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    const storePda = getStorePda(storeAuthority.publicKey);
    const storeAcc = await fetchStoreAcc(program, storePda);

    expect(storeAcc.name).toBe(name);
    expect(storeAcc.image).toBe(image);
    expect(storeAcc.about).toBe(about);
    expect(storeAcc.authority).toStrictEqual(storeAuthority.publicKey);
  });

  test('throws when name is empty', async () => {
    const name = '';
    const image = 'https://example.com/image.png';
    const about = 'about';

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'StoreNameRequired');
    }
  });

  test('throws when name is too long', async () => {
    const name = 'a'.repeat(MAX_STORE_NAME_LEN + 1);
    const image = 'https://example.com/image.png';
    const about = 'about';

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'StoreNameTooLong');
    }
  });

  test('throws when image is empty', async () => {
    const name = 'Store A';
    const image = '';
    const about = 'about';

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'StoreImageRequired');
    }
  });
});
