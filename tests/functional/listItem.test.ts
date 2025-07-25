import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import {
  MAX_STORE_ITEM_NAME_LEN,
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
} from '../constants';
import { fetchItemAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from '../setup';
import { getItemPda, getStorePda } from '../pda';

describe('listItem', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const [admin, treasury, storeAuthority] = Array.from(
    { length: 3 },
    Keypair.generate
  );

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      ...[admin, treasury, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ]));

    await program.methods
      .initializeConfig({
        acceptedMints: [
          {
            mint: USDC_MINT,
            priceUpdateV2: USDC_PRICE_UPDATE_V2,
          },
        ],
        admin: admin.publicKey,
        orderFeeBps: 250,
        treasury: treasury.publicKey,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .initializeStore({
        name: 'Store A',
        image: 'https://example.com/image.png',
        about: 'about',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();
  });

  test('list an item', async () => {
    const price = 10e6; // $1
    const inventoryCount = 10;
    const name = 'Item A';
    const image = 'https://example.com/item.png';
    const description = 'description';

    await program.methods
      .listItem({
        price: new BN(price),
        inventoryCount,
        name,
        image,
        description,
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, name);
    const itemAcc = await fetchItemAcc(program, itemPda);

    expect(itemAcc.store).toStrictEqual(storePda);
    expect(itemAcc.price.toNumber()).toBe(price);
    expect(itemAcc.inventoryCount).toBe(inventoryCount);
    expect(itemAcc.name).toBe(name);
    expect(itemAcc.image).toBe(image);
    expect(itemAcc.description).toBe(description);
  });

  test('throws if item name is empty', async () => {
    const price = 10e6; // $1
    const inventoryCount = 10;
    const name = '';
    const image = 'https://example.com/item.png';
    const description = 'description';

    try {
      await program.methods
        .listItem({
          price: new BN(price),
          inventoryCount,
          name,
          image,
          description,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'ItemNameRequired');
    }
  });

  test('throws if item name is too long', async () => {
    const price = 10e6; // $1
    const inventoryCount = 10;
    const name = '_'.repeat(MAX_STORE_ITEM_NAME_LEN + 1);
    const image = 'https://example.com/item.png';
    const description = 'description';

    expect(async () => {
      await program.methods
        .listItem({
          price: new BN(price),
          inventoryCount,
          name,
          image,
          description,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    }).toThrow();
  });
});
