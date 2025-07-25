import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { beforeEach, describe, expect, test } from 'bun:test';
import { Splurge } from '../../target/types/splurge';
import { MAX_SHOPPER_NAME_LEN } from '../constants';
import { fetchShopperAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from '../setup';
import { getShopperPda } from '../pda';

describe('initializeShopper', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const shopperAuthority = Keypair.generate();

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: shopperAuthority.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test('creates a shopper', async () => {
    const name = 'Shopper A';
    const image = 'https://example.com/image.png';
    const address = 'address';

    await program.methods
      .initializeShopper({
        name,
        image,
        address,
      })
      .accounts({
        authority: shopperAuthority.publicKey,
      })
      .signers([shopperAuthority])
      .rpc();

    const shopperPda = getShopperPda(shopperAuthority.publicKey);
    const shopperAcc = await fetchShopperAcc(program, shopperPda);

    expect(shopperAcc.name).toBe(name);
    expect(shopperAcc.image).toBe(image);
    expect(shopperAcc.address).toBe(address);
    expect(shopperAcc.authority).toStrictEqual(shopperAuthority.publicKey);
  });

  test('throws when name is empty', async () => {
    const name = '';
    const image = 'https://example.com/image.png';
    const address = 'address';

    try {
      await program.methods
        .initializeShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopperAuthority.publicKey,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'ShopperNameRequired');
    }
  });

  test('throws when name is too long', async () => {
    const name = '_'.repeat(MAX_SHOPPER_NAME_LEN + 1);
    const image = 'https://example.com/image.png';
    const address = 'address';

    try {
      await program.methods
        .initializeShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopperAuthority.publicKey,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'ShopperNameTooLong');
    }
  });

  test('throws when image is empty', async () => {
    const name = 'Shopper A';
    const image = '';
    const address = 'address';

    try {
      await program.methods
        .initializeShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopperAuthority.publicKey,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'ShopperImageRequired');
    }
  });

  test('throws when address is empty', async () => {
    const name = 'Shopper A';
    const image = 'https://example.com/image.png';
    const address = '';

    try {
      await program.methods
        .initializeShopper({
          name,
          image,
          address,
        })
        .accounts({
          authority: shopperAuthority.publicKey,
        })
        .signers([shopperAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'ShopperAddressRequired');
    }
  });
});
