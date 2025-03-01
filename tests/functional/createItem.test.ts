import { beforeEach, describe, expect, test } from 'bun:test';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../setup';
import { getItemPdaAndBump, getStorePdaAndBump } from '../pda';
import { MAX_STORE_ITEM_NAME_LEN } from '../constants';
import usdc from '../fixtures/usdc_mint.json';
import { getItemAcc } from '../accounts';

describe('createItem', () => {
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
  });

  test('creates an item', async () => {
    const price = 1000; // $10
    const inventoryCount = 10;
    const name = 'Item A';
    const image = 'https://example.com/item.png';
    const description = 'description';

    await program.methods
      .createItem({
        price,
        inventoryCount,
        name,
        image,
        description,
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda, itemBump] = getItemPdaAndBump(storePda, name);
    const itemAcc = await getItemAcc(program, itemPda);

    expect(itemAcc.bump).toBe(itemBump);
    expect(itemAcc.store).toStrictEqual(storePda);
    expect(itemAcc.price).toBe(price);
    expect(itemAcc.inventoryCount).toBe(inventoryCount);
    expect(itemAcc.name).toBe(name);
    expect(itemAcc.image).toBe(image);
    expect(itemAcc.description).toBe(description);
  });

  test('throws if item name is empty', async () => {
    const price = 1000; // $10
    const inventoryCount = 10;
    const name = '';
    const image = 'https://example.com/item.png';
    const description = 'description';

    try {
      await program.methods
        .createItem({
          price,
          inventoryCount,
          name,
          image,
          description,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ItemNameRequired');
    }
  });

  test('throws if item name is too long', async () => {
    const price = 1000; // $10
    const inventoryCount = 10;
    const name = '_'.repeat(MAX_STORE_ITEM_NAME_LEN + 1);
    const image = 'https://example.com/item.png';
    const description = 'description';

    expect(async () => {
      await program.methods
        .createItem({
          price,
          inventoryCount,
          name,
          image,
          description,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    }).toThrow();
  });

  test('throws if item image is empty', async () => {
    const price = 1000; // $10
    const inventoryCount = 10;
    const name = 'Item A';
    const image = '';
    const description = 'description';

    try {
      await program.methods
        .createItem({
          price,
          inventoryCount,
          name,
          image,
          description,
        })
        .accounts({
          authority: store.publicKey,
        })
        .signers([store])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('ItemImageRequired');
    }
  });
});
